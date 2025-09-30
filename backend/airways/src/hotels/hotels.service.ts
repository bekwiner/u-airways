import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  async searchHotels(
    cityId: number,
    checkIn: Date,
    checkOut: Date,
    guests = 1,
  ) {
    const hotels = await this.prisma.hotel.findMany({
      where: {
        city_id: cityId,
        is_active: true,
      },
      include: {
        city: {
          include: { country: true },
        },
      },
    });

    return hotels.map((hotel) => ({
      ...hotel,
      price_per_night: 120 + Math.random() * 300, // Mock pricing
    }));
  }

  async getHotelById(id: number) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id, is_active: true },
      include: {
        city: {
          include: { country: true },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return hotel;
  }

  async bookHotel(userId: number, bookingData: any) {
    const {
      hotel_id,
      room_type,
      check_in,
      check_out,
      guest_count,
      room_count,
    } = bookingData;

    const hotel = await this.getHotelById(hotel_id);
    const nights = Math.ceil(
      (new Date(check_out).getTime() - new Date(check_in).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const pricePerNight = 150; // Mock price
    const totalPrice = pricePerNight * nights * room_count;

    const booking = await this.prisma.hotelBooking.create({
      data: {
        user_id: userId,
        hotel_id,
        rooms: room_count,
        total_price: totalPrice,
        check_in: new Date(check_in),
        check_out: new Date(check_out),
        status: 'CONFIRMED',
      },
      include: {
        hotel: {
          include: {
            city: true,
          },
        },
      },
    });

    return booking;
  }
}
