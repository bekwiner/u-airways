// src/admin/admin.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalFlights,
      totalBookings,
      totalRevenue,
      recentBookings,
      popularRoutes,
    ] = await Promise.all([
      this.prisma.user.count({ where: { is_active: true } }),
      this.prisma.flight.count({ where: { is_active: true } }),
      this.prisma.ticket.count({
        where: { status: { notIn: ['CANCELLED'] } },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'PAYMENT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.ticket.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true, email: true } },
          flight: {
            include: {
              departure_airport: { select: { code: true, name: true } },
              arrival_airport: { select: { code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.$queryRaw`
        SELECT 
          da.code as departure,
          aa.code as arrival,
          COUNT(*) as bookings
        FROM tickets t
        JOIN flights f ON t.flight_id = f.id
        JOIN airports da ON f.departure_airport_id = da.id
        JOIN airports aa ON f.arrival_airport_id = aa.id
        WHERE t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY da.code, aa.code
        ORDER BY bookings DESC
        LIMIT 10
      `,
    ]);

    return {
      stats: {
        total_users: totalUsers,
        total_flights: totalFlights,
        total_bookings: totalBookings,
        total_revenue: Number(totalRevenue._sum?.amount || 0),
      },
      recent_bookings: recentBookings,
      popular_routes: popularRoutes,
    };
  }

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          created_at: true,
          _count: {
            select: { tickets: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  }

  async getUserDetails(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tickets: {
          include: {
            flight: {
              include: {
                departure_airport: true,
                arrival_airport: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        loyalty: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(userId: number, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { is_active: isActive },
    });

    return updatedUser;
  }

  async getAllFlights(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { is_active: true };

    if (status) {
      where.status = status;
    }

    const [flights, total] = await Promise.all([
      this.prisma.flight.findMany({
        where,
        include: {
          departure_airport: { include: { city: true } },
          arrival_airport: { include: { city: true } },
          plane: { include: { company: true } },
          _count: {
            select: { tickets: true },
          },
        },
        orderBy: { departure_time: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.flight.count({ where }),
    ]);

    return {
      flights,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  }

  async getBookings(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: { select: { full_name: true, email: true } },
          flight: {
            include: {
              departure_airport: { select: { code: true, name: true } },
              arrival_airport: { select: { code: true, name: true } },
              plane: { include: { company: true } },
            },
          },
          seat: { include: { class: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  }

  async getRevenuReport(startDate: Date, endDate: Date) {
    const revenue = await this.prisma.transaction.groupBy({
      by: ['created_at'],
      where: {
        type: 'PAYMENT',
        status: 'COMPLETED',
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return revenue.map((item) => ({
      date: item.created_at,
      revenue: Number(item._sum.amount || 0),
    }));
  }

  // Flight CRUD operations
  async createFlight(flightData: any) {
    const {
      flight_number,
      plane_id,
      departure_airport_id,
      arrival_airport_id,
      departure_time,
      arrival_time,
      base_price,
      gate,
      terminal,
      status = 'SCHEDULED',
    } = flightData;

    // Validate plane exists
    const plane = await this.prisma.plane.findUnique({
      where: { id: plane_id },
    });
    if (!plane) {
      throw new NotFoundException('Plane not found');
    }

    // Validate airports exist
    const [departureAirport, arrivalAirport] = await Promise.all([
      this.prisma.airport.findUnique({ where: { id: departure_airport_id } }),
      this.prisma.airport.findUnique({ where: { id: arrival_airport_id } }),
    ]);

    if (!departureAirport || !arrivalAirport) {
      throw new NotFoundException('Airport not found');
    }

    const flight = await this.prisma.flight.create({
      data: {
        flight_number,
        plane_id,
        departure_airport_id,
        arrival_airport_id,
        departure_time: new Date(departure_time),
        arrival_time: new Date(arrival_time),
        base_price,
        gate,
        terminal,
        status,
      },
      include: {
        plane: { include: { company: true } },
        departure_airport: { include: { city: true } },
        arrival_airport: { include: { city: true } },
      },
    });

    return flight;
  }

  async updateFlight(flightId: number, updateData: any) {
    const flight = await this.prisma.flight.findUnique({
      where: { id: flightId },
    });

    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    const updatedFlight = await this.prisma.flight.update({
      where: { id: flightId },
      data: {
        ...updateData,
        departure_time: updateData.departure_time
          ? new Date(updateData.departure_time)
          : undefined,
        arrival_time: updateData.arrival_time
          ? new Date(updateData.arrival_time)
          : undefined,
      },
      include: {
        plane: { include: { company: true } },
        departure_airport: { include: { city: true } },
        arrival_airport: { include: { city: true } },
      },
    });

    return updatedFlight;
  }

  async deleteFlight(flightId: number) {
    const flight = await this.prisma.flight.findUnique({
      where: { id: flightId },
      include: { tickets: true },
    });

    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    // Check if flight has active bookings
    const activeBookings = flight.tickets.filter(
      (ticket) => !['CANCELLED', 'COMPLETED'].includes(ticket.status),
    );

    if (activeBookings.length > 0) {
      throw new ForbiddenException(
        'Cannot delete flight with active bookings. Cancel all bookings first.',
      );
    }

    await this.prisma.flight.update({
      where: { id: flightId },
      data: { is_active: false },
    });

    return { message: 'Flight deactivated successfully' };
  }

  async cancelFlight(flightId: number, reason?: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id: flightId },
      include: { tickets: true },
    });

    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    if (flight.status === 'CANCELLED') {
      throw new ForbiddenException('Flight is already cancelled');
    }

    // Cancel flight
    await this.prisma.flight.update({
      where: { id: flightId },
      data: { status: 'CANCELLED' },
    });

    // Cancel all active tickets and create refund transactions
    const activeTickets = flight.tickets.filter(
      (ticket) => ticket.status === 'BOOKED' || ticket.status === 'CONFIRMED',
    );

    if (activeTickets.length > 0) {
      await Promise.all(
        activeTickets.map(async (ticket) => {
          // Update ticket status
          await this.prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'CANCELLED' },
          });

          // Release seat
          await this.prisma.seat.update({
            where: { id: ticket.seat_id },
            data: { is_available: true },
          });

          // Create refund transaction
          await this.prisma.transaction.create({
            data: {
              user_id: ticket.user_id,
              amount: ticket.total_price.negated(),
              type: 'REFUND',
              description: `Flight cancellation refund - ${reason || 'Administrative cancellation'}`,
              status: 'COMPLETED',
              reference_id: ticket.booking_reference,
            },
          });
        }),
      );
    }

    return {
      message: 'Flight cancelled successfully',
      cancelled_tickets: activeTickets.length,
    };
  }
}
