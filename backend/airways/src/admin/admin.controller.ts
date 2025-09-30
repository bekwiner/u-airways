// src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(+page, +limit, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  async getUserDetails(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserDetails(id);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { is_active: boolean },
  ) {
    return this.adminService.updateUserStatus(id, data.is_active);
  }

  @Get('flights')
  @ApiOperation({ summary: 'Get all flights' })
  @ApiResponse({ status: 200, description: 'Flights retrieved successfully' })
  async getAllFlights(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllFlights(+page, +limit, status);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getBookings(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getBookings(+page, +limit, status);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiResponse({
    status: 200,
    description: 'Revenue report retrieved successfully',
  })
  async getRevenuReport(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.adminService.getRevenuReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Flight CRUD endpoints
  @Post('flights')
  @ApiOperation({ summary: 'Create a new flight' })
  @ApiResponse({ status: 201, description: 'Flight created successfully' })
  async createFlight(@Body() flightData: any) {
    return this.adminService.createFlight(flightData);
  }

  @Put('flights/:id')
  @ApiOperation({ summary: 'Update flight details' })
  @ApiResponse({ status: 200, description: 'Flight updated successfully' })
  async updateFlight(
    @Param('id', ParseIntPipe) flightId: number,
    @Body() updateData: any,
  ) {
    return this.adminService.updateFlight(flightId, updateData);
  }

  @Delete('flights/:id')
  @ApiOperation({ summary: 'Delete flight (deactivate)' })
  @ApiResponse({ status: 200, description: 'Flight deactivated successfully' })
  async deleteFlight(@Param('id', ParseIntPipe) flightId: number) {
    return this.adminService.deleteFlight(flightId);
  }

  @Post('flights/:id/cancel')
  @ApiOperation({ summary: 'Cancel flight and refund all bookings' })
  @ApiResponse({ status: 200, description: 'Flight cancelled successfully' })
  async cancelFlight(
    @Param('id', ParseIntPipe) flightId: number,
    @Body() data?: { reason?: string },
  ) {
    return this.adminService.cancelFlight(flightId, data?.reason);
  }
}
