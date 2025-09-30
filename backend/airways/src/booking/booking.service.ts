import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(userId: number, createBookingDto: CreateBookingDto) {
    const {
      flight_id,
      class_id,
      passengers,
      seat_ids,
      passenger_name,
      passenger_passport,
      special_requests,
    } = createBookingDto;

    // Validate flight exists and is available
    const flight = await this.prisma.flight.findUnique({
      where: { id: flight_id },
      include: {
        plane: {
          include: {
            seats: {
              where: {
                id: { in: seat_ids },
                is_available: true,
              },
            },
          },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    if (flight.status !== 'SCHEDULED') {
      throw new BadRequestException('Flight is not available for booking');
    }

    if (
      flight.plane.seats.length !== seat_ids.length ||
      seat_ids.length !== passengers
    ) {
      throw new BadRequestException('Not enough available seats');
    }

    // Check if seats belong to the flight's plane
    const seatIdsFromPlane = flight.plane.seats.map((s) => s.id);
    const invalidSeats = seat_ids.filter(
      (id) => !seatIdsFromPlane.includes(id),
    );
    if (invalidSeats.length > 0) {
      throw new BadRequestException('Some seats do not belong to this flight');
    }

    // Generate booking reference
    const bookingReference = `BK${Math.random().toString(36).substr(2, 6).toUpperCase()}${Date.now().toString().slice(-4)}`;

    // Calculate total price
    const classInfo = await this.prisma.class.findUnique({
      where: { id: class_id },
    });

    if (!classInfo) {
      throw new NotFoundException('Class not found');
    }

    const basePrice = flight.base_price.toNumber();
    const classMultiplier = class_id === 1 ? 1 : 1.5; // Economy: 1x, Business: 1.5x
    const pricePerPassenger = basePrice * classMultiplier;
    const totalPrice = pricePerPassenger * passengers;
    const taxesFees = totalPrice * 0.12; // 12% taxes
    const finalTotal = totalPrice + taxesFees;

    // Create booking transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tickets for each passenger
      const tickets = await Promise.all(
        seat_ids.map(async (seatId, index) => {
          return tx.ticket.create({
            data: {
              booking_reference: bookingReference,
              flight_id,
              user_id: userId,
              seat_id: seatId,
              class_id,
              passenger_name: passenger_name || `Passenger ${index + 1}`,
              passenger_passport,
              price: pricePerPassenger,
              taxes_fees: taxesFees / passengers,
              total_price: finalTotal / passengers,
              status: 'BOOKED',
              special_requests,
            },
          });
        }),
      );

      // Update seats to unavailable
      await tx.seat.updateMany({
        where: { id: { in: seat_ids } },
        data: { is_available: false },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          user_id: userId,
          amount: new Prisma.Decimal(finalTotal),
          type: 'PAYMENT',
          description: `Flight booking ${bookingReference}`,
          status: 'PENDING',
          reference_id: bookingReference,
        },
      });

      return { tickets, bookingReference, totalPrice: finalTotal };
    });

    return {
      success: true,
      booking_reference: result.bookingReference,
      tickets: result.tickets,
      total_amount: result.totalPrice,
      message: 'Booking created successfully. Please complete payment.',
    };
  }

  async getUserBookings(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { user_id: userId },
        include: {
          flight: {
            include: {
              plane: {
                include: {
                  company: true,
                },
              },
              departure_airport: {
                include: { city: true },
              },
              arrival_airport: {
                include: { city: true },
              },
            },
          },
          seat: {
            include: { class: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where: { user_id: userId } }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingByReference(reference: string) {
    const booking = await this.prisma.ticket.findFirst({
      where: { booking_reference: reference },
      include: {
        flight: {
          include: {
            plane: {
              include: {
                company: true,
              },
            },
            departure_airport: {
              include: { city: true },
            },
            arrival_airport: {
              include: { city: true },
            },
          },
        },
        seat: {
          include: { class: true },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async cancelBooking(reference: string, userId: number) {
    const booking = await this.prisma.ticket.findFirst({
      where: {
        booking_reference: reference,
        user_id: userId,
        status: { in: ['BOOKED', 'CONFIRMED'] },
      },
      include: {
        flight: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or already processed');
    }

    // Check if flight has departed
    if (booking.flight.departure_time < new Date()) {
      throw new BadRequestException(
        'Cannot cancel booking after flight departure',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update ticket status
      await tx.ticket.updateMany({
        where: { booking_reference: reference },
        data: { status: 'CANCELLED' },
      });

      // Release seats
      const seats = await tx.ticket.findMany({
        where: { booking_reference: reference },
        select: { seat_id: true },
      });

      await tx.seat.updateMany({
        where: { id: { in: seats.map((s) => s.seat_id) } },
        data: { is_available: true },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          user_id: userId,
          amount: new Prisma.Decimal(
            -booking.total_price.toNumber() * seats.length,
          ), // Negative for refund
          type: 'REFUND',
          description: `Booking cancellation ${reference}`,
          status: 'COMPLETED',
          reference_id: reference,
        },
      });

      return { success: true };
    });

    return result;
  }
}
