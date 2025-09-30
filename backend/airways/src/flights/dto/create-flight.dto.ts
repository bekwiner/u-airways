import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateFlightDto {
  @ApiProperty({ example: 'HY123' })
  @IsString()
  flight_number: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  plane_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  departure_airport_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  arrival_airport_id: number;

  @ApiProperty({ example: '2024-12-01T10:00:00.000Z' })
  @IsDateString()
  departure_time: string;

  @ApiProperty({ example: '2024-12-01T14:00:00.000Z' })
  @IsDateString()
  arrival_time: string;

  @ApiProperty({ example: 500.0 })
  base_price: number;

  @ApiPropertyOptional({ example: 'A1' })
  @IsOptional()
  @IsString()
  gate?: string;

  @ApiPropertyOptional({ example: 'T1' })
  @IsOptional()
  @IsString()
  terminal?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
