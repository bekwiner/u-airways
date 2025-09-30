import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Public()
  @Get('search')
  async searchHotels(
    @Query('city_id') cityId: number,
    @Query('check_in') checkIn: string,
    @Query('check_out') checkOut: string,
    @Query('guests') guests = 1,
  ) {
    return this.hotelsService.searchHotels(
      +cityId,
      new Date(checkIn),
      new Date(checkOut),
      +guests,
    );
  }

  @Public()
  @Get(':id')
  async getHotelById(@Param('id', ParseIntPipe) id: number) {
    return this.hotelsService.getHotelById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('book')
  async bookHotel(@CurrentUser() user: any, @Body() bookingData: any) {
    return this.hotelsService.bookHotel(user.id, bookingData);
  }
}
