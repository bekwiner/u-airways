// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: NotificationType,
  ) {
    return this.prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
        type,
      },
    });
  }

  async getUserNotifications(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { user_id: userId } }),
    ]);

    return {
      notifications,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  }

  async markAsRead(notificationId: number, userId: number) {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: { is_read: true },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId },
      data: { is_read: true },
    });

    return { message: 'All notifications marked as read' };
  }
}
