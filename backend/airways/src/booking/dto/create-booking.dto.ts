import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  flight_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  class_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  passengers: number;

  @ApiProperty({ example: [1, 2] })
  @IsArray()
  @IsInt({ each: true })
  seat_ids: number[];

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  passenger_name?: string;

  @ApiPropertyOptional({ example: 'AA1234567' })
  @IsOptional()
  @IsString()
  passenger_passport?: string;

  @ApiPropertyOptional({ example: { special_meal: true, wheelchair: false } })
  @IsOptional()
  @IsObject()
  special_requests?: any;
}
