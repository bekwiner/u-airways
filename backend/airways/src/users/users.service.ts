// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        created_at: true,
        loyalty: {
          select: {
            points: true,
            tier: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
    const { email, phone, ...otherData } = updateUserDto;

    // Check email uniqueness if email is being updated
    if (email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check phone uniqueness if phone is being updated
    if (phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: { phone, id: { not: userId } },
      });

      if (existingUser) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email,
        phone,
        ...otherData,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        updated_at: true,
      },
    });

    return updatedUser;
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getUserStats(userId: number) {
    const [ticketsCount, totalSpent, loyaltyProgram] = await Promise.all([
      this.prisma.ticket.count({
        where: { user_id: userId, status: { notIn: ['CANCELLED'] } },
      }),
      this.prisma.transaction.aggregate({
        where: { user_id: userId, type: 'PAYMENT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.loyalty.findUnique({
        where: { user_id: userId },
      }),
    ]);

    return {
      total_bookings: ticketsCount,
      total_spent: Number(totalSpent._sum?.amount || 0),
      loyalty_points: loyaltyProgram?.points || 0,
      loyalty_tier: loyaltyProgram?.tier || 'BRONZE',
    };
  }
}
