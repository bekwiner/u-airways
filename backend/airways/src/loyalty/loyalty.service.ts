import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyTier } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getUserLoyalty(userId: number) {
    const loyalty = await this.prisma.loyalty.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: { full_name: true, email: true },
        },
      },
    });

    return loyalty;
  }

  async addPoints(userId: number, points: number, reason: string) {
    const loyalty = await this.prisma.loyalty.upsert({
      where: { user_id: userId },
      update: {
        points: { increment: points },
      },
      create: {
        user_id: userId,
        points: points,
        tier: LoyaltyTier.BRONZE,
      },
    });

    // Update tier based on points
    let newTier: LoyaltyTier = LoyaltyTier.BRONZE;
    if (loyalty.points >= 10000) newTier = LoyaltyTier.PLATINUM;
    else if (loyalty.points >= 5000) newTier = LoyaltyTier.GOLD;
    else if (loyalty.points >= 1000) newTier = LoyaltyTier.SILVER;

    if (newTier !== loyalty.tier) {
      await this.prisma.loyalty.update({
        where: { user_id: userId },
        data: { tier: newTier },
      });
    }

    return loyalty;
  }

  async redeemPoints(userId: number, points: number) {
    const loyalty = await this.prisma.loyalty.findUnique({
      where: { user_id: userId },
    });

    if (!loyalty || loyalty.points < points) {
      throw new Error('Insufficient points');
    }

    await this.prisma.loyalty.update({
      where: { user_id: userId },
      data: { points: { decrement: points } },
    });

    return { message: 'Points redeemed successfully' };
  }
}
