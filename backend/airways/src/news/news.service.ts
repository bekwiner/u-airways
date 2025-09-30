import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async createNews(createNewsDto: CreateNewsDto) {
    const { title, content, is_featured } = createNewsDto;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const news = await this.prisma.news.create({
      data: {
        title,
        slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
        content,
        is_featured: is_featured || false,
        is_published: true,
        published_at: new Date(),
      },
    });

    return news;
  }

  async getPublishedNews(page = 1, limit = 10, featured?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = { is_published: true };

    if (featured !== undefined) {
      where.is_featured = featured;
    }

    const [news, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      news,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  }

  async getNewsById(id: number) {
    const news = await this.prisma.news.findFirst({
      where: {
        id,
        is_published: true,
      },
    });

    if (!news) {
      throw new NotFoundException('News article not found');
    }

    // Increment views count
    await this.prisma.news.update({
      where: { id },
      data: { views_count: { increment: 1 } },
    });

    return news;
  }

  async getNewsBySlug(slug: string) {
    const news = await this.prisma.news.findFirst({
      where: {
        slug,
        is_published: true,
      },
    });

    if (!news) {
      throw new NotFoundException('News article not found');
    }

    // Increment views count
    await this.prisma.news.update({
      where: { id: news.id },
      data: { views_count: { increment: 1 } },
    });

    return news;
  }

  async updateNews(id: number, updateNewsDto: UpdateNewsDto) {
    const news = await this.prisma.news.findUnique({ where: { id } });

    if (!news) {
      throw new NotFoundException('News article not found');
    }

    const updatedNews = await this.prisma.news.update({
      where: { id },
      data: updateNewsDto,
    });

    return updatedNews;
  }

  async deleteNews(id: number) {
    const news = await this.prisma.news.findUnique({ where: { id } });

    if (!news) {
      throw new NotFoundException('News article not found');
    }

    await this.prisma.news.delete({ where: { id } });

    return { message: 'News article deleted successfully' };
  }

  async getFeaturedNews(limit = 5) {
    return this.prisma.news.findMany({
      where: {
        is_published: true,
        is_featured: true,
      },
      orderBy: { published_at: 'desc' },
      take: limit,
    });
  }
}
