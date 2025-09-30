import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global configuration
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS configuration that supports multiple, comma-separated origins and a "*" wildcard for dev
  const rawOrigins = configService.get<string>('FRONTEND_URL');
  const parsedOrigins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const fallbackOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const allowAllOrigins = parsedOrigins?.includes('*');
  const effectiveOrigins = allowAllOrigins
    ? []
    : parsedOrigins && parsedOrigins.length > 0
      ? parsedOrigins
      : fallbackOrigins;

  const corsOptions: CorsOptions = allowAllOrigins
    ? {
        origin: true,
        credentials: true,
      }
    : {
        origin: (requestOrigin, callback) => {
          if (!requestOrigin || effectiveOrigins.includes(requestOrigin)) {
            callback(null, true);
            return;
          }
          callback(null, false);
        },
        credentials: true,
      };

  app.enableCors(corsOptions);

  // Global pipes and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Airways API')
    .setDescription('Comprehensive flight booking and management system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('users', 'User Management')
    .addTag('flights', 'Flight Operations')
    .addTag('bookings', 'Booking Management')
    .addTag('admin', 'Admin Operations')
    .addTag('reviews', 'Reviews & Ratings')
    .addTag('loyalty', 'Loyalty Program')
    .addTag('news', 'News & Announcements')
    .addTag('hotels', 'Hotel Booking')
    .addTag('taxis', 'Taxi Services')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(configService.get('PORT') ?? 2000);
  await app.listen(port);

  console.log(`Airways API running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();


