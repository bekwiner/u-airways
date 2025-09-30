// src/payment/dto/create-payment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYME = 'payme',
  CLICK = 'click',
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  reference_id: string; // ticket_id or booking_id

  @ApiProperty({ enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
