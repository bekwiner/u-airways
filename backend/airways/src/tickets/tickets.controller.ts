import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get(':reference')
  async getTicketByReference(@Param('reference') reference: string) {
    return this.ticketsService.getTicketByReference(reference);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':reference/checkin')
  async checkIn(
    @CurrentUser() user: any,
    @Param('reference') reference: string,
  ) {
    return this.ticketsService.checkIn(reference, user.id);
  }
}
