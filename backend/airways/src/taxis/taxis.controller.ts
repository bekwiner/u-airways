import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaxisService } from './taxis.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('taxis')
@Controller('taxis')
export class TaxisController {
  constructor(private readonly taxisService: TaxisService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all taxis' })
  @ApiResponse({ status: 200, description: 'Taxis retrieved successfully' })
  async findAll(
    @Query('city_id') cityId?: number,
    @Query('is_active') isActive = true,
  ) {
    return this.taxisService.findAll(cityId, isActive);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get taxi by ID' })
  @ApiResponse({ status: 200, description: 'Taxi retrieved successfully' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taxisService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new taxi' })
  @ApiResponse({ status: 201, description: 'Taxi created successfully' })
  async create(@Body() createTaxiDto: any) {
    return this.taxisService.create(createTaxiDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update taxi' })
  @ApiResponse({ status: 200, description: 'Taxi updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaxiDto: any,
  ) {
    return this.taxisService.update(id, updateTaxiDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete taxi' })
  @ApiResponse({ status: 200, description: 'Taxi deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.taxisService.remove(id);
  }

  @Post('book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a taxi' })
  @ApiResponse({ status: 201, description: 'Taxi booked successfully' })
  async bookTaxi(@Body() createBookingDto: any, @CurrentUser() user: any) {
    return this.taxisService.createBooking(createBookingDto, user.id);
  }

  @Get('bookings/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all taxi bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getAllBookings(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.taxisService.findBookings(user.id, status);
  }
}
