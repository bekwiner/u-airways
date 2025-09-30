// src/loyalty/loyalty.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  async getUserLoyalty(@CurrentUser() user: any) {
    return this.loyaltyService.getUserLoyalty(user.id);
  }

  @Post('redeem')
  async redeemPoints(
    @CurrentUser() user: any,
    @Body() data: { points: number },
  ) {
    return this.loyaltyService.redeemPoints(user.id, data.points);
  }
}
