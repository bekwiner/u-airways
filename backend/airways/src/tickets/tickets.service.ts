import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async getTicketByReference(bookingReference: string) {
    return this.prisma.ticket.findFirst({
      where: { booking_reference: bookingReference },
      include: {
        flight: {
          include: {
            departure_airport: { include: { city: true } },
            arrival_airport: { include: { city: true } },
            plane: { include: { company: true } },
          },
        },
        seat: { include: { class: true } },
        user: { select: { full_name: true, email: true } },
      },
    });
  }

  async checkIn(bookingReference: string, userId: number) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        booking_reference: bookingReference,
        user_id: userId,
        status: 'CONFIRMED',
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found or already checked in');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'CHECKED_IN',
      },
    });

    return updatedTicket;
  }
}
