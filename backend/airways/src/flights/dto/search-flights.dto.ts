// src/flights/dto/search-flights.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

enum TripType {
  ONE_WAY = 'one_way',
  ROUND_TRIP = 'round_trip',
  MULTI_CITY = 'multi_city',
}

enum ClassType {
  ECONOMY = 'Economy',
  BUSINESS = 'Business',
  FIRST = 'First',
}

export class SearchFlightsDto {
  @ApiProperty({ example: 'TAS' })
  @IsString()
  departure_airport: string;

  @ApiProperty({ example: 'NYC' })
  @IsString()
  arrival_airport: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  departure_date: string;

  @ApiPropertyOptional({ example: '2024-12-08' })
  @IsOptional()
  @IsDateString()
  return_date?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 9 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  @Type(() => Number)
  adults?: number = 1;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(8)
  @Type(() => Number)
  children?: number = 0;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  @Type(() => Number)
  infants?: number = 0;

  @ApiPropertyOptional({ enum: ClassType, default: ClassType.ECONOMY })
  @IsOptional()
  @IsEnum(ClassType)
  class?: ClassType = ClassType.ECONOMY;

  @ApiPropertyOptional({ enum: TripType, default: TripType.ONE_WAY })
  @IsOptional()
  @IsEnum(TripType)
  trip_type?: TripType = TripType.ONE_WAY;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  airlines?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  max_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  max_stops?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  direct_only?: boolean = false;
}
