import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchFlightsDto } from './dto/search-flights.dto';

@Injectable()
export class FlightsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async searchFlights(searchDto: SearchFlightsDto) {
    const {
      departure_airport,
      arrival_airport,
      departure_date,
      return_date,
      adults = 1,
      children = 0,
      infants = 0,
      class: classType = 'Economy',
      airlines,
      max_price,
      max_stops,
      direct_only = false,
    } = searchDto;

    const totalPassengers = adults + children + infants;

    // Build where clause
    const where: any = {
      departure_airport: {
        code: departure_airport,
      },
      arrival_airport: {
        code: arrival_airport,
      },
      departure_time: {
        gte: new Date(`${departure_date}T00:00:00.000Z`),
        lt: new Date(`${departure_date}T23:59:59.999Z`),
      },
      status: 'SCHEDULED',
      is_active: true,
    };

    if (airlines && airlines.length > 0) {
      where.plane = {
        company: {
          code: { in: airlines },
        },
      };
    }

    if (max_price) {
      where.base_price = { lte: max_price };
    }

    if (direct_only) {
      // Assuming direct flights have no stops, but since no stops field, perhaps check if same company or something
      // For simplicity, assume all are direct
    }

    const flights = await this.prisma.flight.findMany({
      where,
      include: {
        plane: {
          include: {
            company: true,
            seats: {
              where: {
                class: {
                  name: classType,
                },
                is_available: true,
              },
              take: totalPassengers,
            },
          },
        },
        departure_airport: {
          include: {
            city: true,
          },
        },
        arrival_airport: {
          include: {
            city: true,
          },
        },
      },
    });

    // Filter flights with enough seats
    const availableFlights = flights.filter(
      (flight) => flight.plane.seats.length >= totalPassengers,
    );

    // Calculate prices and availability
    const result = availableFlights.map((flight) => ({
      id: flight.id,
      flight_number: flight.flight_number,
      departure: {
        airport: flight.departure_airport.code,
        city: flight.departure_airport.city.name,
        time: flight.departure_time,
        terminal: flight.terminal,
        gate: flight.gate,
      },
      arrival: {
        airport: flight.arrival_airport.code,
        city: flight.arrival_airport.city.name,
        time: flight.arrival_time,
        terminal: flight.terminal,
      },
      airline: {
        name: flight.plane.company.name,
        code: flight.plane.company.code,
        logo: flight.plane.company.logo_url,
      },
      aircraft: flight.plane.model,
      duration: Math.floor(
        (flight.arrival_time.getTime() - flight.departure_time.getTime()) /
          (1000 * 60),
      ),
      price: flight.base_price,
      class: classType,
      available_seats: flight.plane.seats.length,
      stops: 0, // Assuming direct
    }));

    return result;
  }

  async getFlightById(id: number) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        plane: {
          include: {
            company: true,
            seats: {
              include: {
                class: true,
              },
            },
          },
        },
        departure_airport: {
          include: {
            city: true,
          },
        },
        arrival_airport: {
          include: {
            city: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    return flight;
  }

  async getAllFlights(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [flights, total] = await Promise.all([
      this.prisma.flight.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          plane: {
            include: {
              company: true,
            },
          },
          departure_airport: true,
          arrival_airport: true,
        },
        orderBy: { departure_time: 'desc' },
      }),
      this.prisma.flight.count({ where }),
    ]);

    return {
      flights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createFlight(data: any) {
    return this.prisma.flight.create({
      data,
      include: {
        plane: {
          include: {
            company: true,
          },
        },
        departure_airport: true,
        arrival_airport: true,
      },
    });
  }

  async updateFlight(id: number, data: any) {
    return this.prisma.flight.update({
      where: { id },
      data,
      include: {
        plane: {
          include: {
            company: true,
          },
        },
        departure_airport: true,
        arrival_airport: true,
      },
    });
  }

  async deleteFlight(id: number) {
    return this.prisma.flight.delete({
      where: { id },
    });
  }

  async getPopularRoutes() {
    // For now, return empty array since no bookings exist yet
    // In production, this would aggregate from tickets/flights
    return [];
  }
}
