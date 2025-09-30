// src/reviews/reviews.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: number, createReviewDto: CreateReviewDto) {
    const { flight_id, rating, comment } = createReviewDto;

    // Check if user has a completed ticket for this flight
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        user_id: userId,
        flight_id,
        status: 'CONFIRMED',
      },
    });

    if (!ticket) {
      throw new BadRequestException(
        'You can only review flights you have completed',
      );
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findFirst({
      where: { user_id: userId, flight_id },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this flight');
    }

    const review = await this.prisma.review.create({
      data: {
        user_id: userId,
        flight_id,
        rating,
        comment,
      },
      include: {
        user: {
          select: { full_name: true, id: true },
        },
        flight: {
          select: {
            flight_number: true,
            departure_airport: { select: { code: true, name: true } },
            arrival_airport: { select: { code: true, name: true } },
          },
        },
      },
    });

    return review;
  }

  async getFlightReviews(flightId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total, averageRating] = await Promise.all([
      this.prisma.review.findMany({
        where: { flight_id: flightId },
        include: {
          user: {
            select: { full_name: true, id: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { flight_id: flightId } }),
      this.prisma.review.aggregate({
        where: { flight_id: flightId },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return {
      reviews,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
      average_rating: Number(averageRating._avg.rating?.toFixed(1) || 0),
    };
  }

  async getUserReviews(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { user_id: userId },
        include: {
          flight: {
            include: {
              departure_airport: { select: { code: true, name: true } },
              arrival_airport: { select: { code: true, name: true } },
              plane: { include: { company: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { user_id: userId } }),
    ]);

    return {
      reviews,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  }
}
