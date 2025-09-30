// src/news/news.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
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
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get published news' })
  @ApiResponse({ status: 200, description: 'News retrieved successfully' })
  async getNews(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('featured') featured?: boolean,
  ) {
    return this.newsService.getPublishedNews(+page, +limit, featured);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured news' })
  @ApiResponse({
    status: 200,
    description: 'Featured news retrieved successfully',
  })
  async getFeaturedNews(@Query('limit') limit = 5) {
    return this.newsService.getFeaturedNews(+limit);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get news by slug' })
  @ApiResponse({
    status: 200,
    description: 'News article retrieved successfully',
  })
  async getNewsBySlug(@Param('slug') slug: string) {
    return this.newsService.getNewsBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({
    status: 200,
    description: 'News article retrieved successfully',
  })
  async getNewsById(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.getNewsById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create news article (Admin only)' })
  @ApiResponse({ status: 201, description: 'News created successfully' })
  async createNews(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.createNews(createNewsDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update news article (Admin only)' })
  @ApiResponse({ status: 200, description: 'News updated successfully' })
  async updateNews(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    return this.newsService.updateNews(id, updateNewsDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete news article (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'News deleted successfully' })
  async deleteNews(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.deleteNews(id);
  }
}
