import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

@Injectable()
export class TaxisService {
  constructor(private prisma: PrismaService) {}

  async findAll(cityId?: number, isActive = true) {
    const where: any = { is_active: isActive };
    if (cityId) {
      where.city_id = cityId;
    }

    return this.prisma.taxi.findMany({
      where,
      include: {
        city: true,
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: number) {
    const taxi = await this.prisma.taxi.findUnique({
      where: { id },
      include: {
        city: true,
        bookings: {
          where: { status: 'CONFIRMED' },
          take: 5,
        },
      },
    });

    if (!taxi) {
      throw new NotFoundException('Taxi not found');
    }

    return taxi;
  }

  async create(createTaxiDto: any) {
    return this.prisma.taxi.create({
      data: createTaxiDto,
      include: { city: true },
    });
  }

  async update(id: number, updateTaxiDto: any) {
    const taxi = await this.prisma.taxi.findUnique({ where: { id } });
    if (!taxi) {
      throw new NotFoundException('Taxi not found');
    }

    return this.prisma.taxi.update({
      where: { id },
      data: updateTaxiDto,
      include: { city: true },
    });
  }

  async remove(id: number) {
    const taxi = await this.prisma.taxi.findUnique({ where: { id } });
    if (!taxi) {
      throw new NotFoundException('Taxi not found');
    }

    return this.prisma.taxi.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async createBooking(createBookingDto: any, userId: number) {
    const { taxi_id, pickup_location, dropoff_location, pickup_time, passengers } = createBookingDto;

    const taxi = await this.prisma.taxi.findUnique({ where: { id: taxi_id } });
    if (!taxi) {
      throw new NotFoundException('Taxi not found');
    }

    // Simple price calculation (base + distance estimate)
    const basePrice = 5.00;
    const distanceEstimate = 10; // km
    const pricePerKm = 1.50;
    const totalPrice = basePrice + (distanceEstimate * pricePerKm) * passengers;

    return this.prisma.taxiBooking.create({
      data: {
        user_id: userId,
        taxi_id,
        pickup_location,
        dropoff_location,
        pickup_time: new Date(pickup_time),
        passengers,
        total_price: totalPrice,
      },
      include: {
        user: { select: { full_name: true } },
        taxi: true,
      },
    });
  }

  async findBookings(userId?: number, status?: string) {
    const where: any = {};
    if (userId) {
      where.user_id = userId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.taxiBooking.findMany({
      where,
      include: {
        user: { select: { full_name: true, phone: true } },
        taxi: { include: { city: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
