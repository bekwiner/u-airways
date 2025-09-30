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
import { Public } from '../common/decorators/public.decorator';
import { FlightsService } from './flights.service';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Public()
  @Post('search')
  @ApiOperation({ summary: 'Search for flights' })
  @ApiResponse({ status: 200, description: 'Flights found successfully' })
  async searchFlights(@Body() searchDto: SearchFlightsDto) {
    return this.flightsService.searchFlights(searchDto);
  }

  @Public()
  @Get('popular-routes')
  @ApiOperation({ summary: 'Get popular flight routes' })
  @ApiResponse({ status: 200, description: 'Popular routes retrieved' })
  async getPopularRoutes() {
    return this.flightsService.getPopularRoutes();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get flight details' })
  @ApiResponse({ status: 200, description: 'Flight details retrieved' })
  async getFlight(@Param('id', ParseIntPipe) id: number) {
    return this.flightsService.getFlightById(id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all flights (Admin)' })
  @ApiResponse({ status: 200, description: 'Flights retrieved successfully' })
  async getAllFlights(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.flightsService.getAllFlights(+page, +limit, status);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new flight (Admin)' })
  @ApiResponse({ status: 201, description: 'Flight created successfully' })
  async createFlight(@Body() data: any) {
    return this.flightsService.createFlight(data);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update flight (Admin)' })
  @ApiResponse({ status: 200, description: 'Flight updated successfully' })
  async updateFlight(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.flightsService.updateFlight(id, data);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete flight (Admin)' })
  @ApiResponse({ status: 200, description: 'Flight deleted successfully' })
  async deleteFlight(@Param('id', ParseIntPipe) id: number) {
    return this.flightsService.deleteFlight(id);
  }
}
