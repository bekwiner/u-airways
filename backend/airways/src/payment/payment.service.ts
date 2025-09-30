// src/payment/payment.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, PaymentGateway } from './dto/create-payment.dto';
import { StripeGateway } from './gateways/stripe.gateway';
import { PaymeGateway } from './gateways/payme.gateway';
import { ClickGateway } from './gateways/click.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private stripeGateway: StripeGateway,
    private paymeGateway: PaymeGateway,
    private clickGateway: ClickGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  async createPayment(userId: number, createPaymentDto: CreatePaymentDto) {
    const { amount, reference_id, gateway, currency, description } =
      createPaymentDto;

    // Validate user exists and has sufficient balance if needed
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        user_id: userId,
        amount,
        type: 'PAYMENT',
        description: description || `Payment for ${reference_id}`,
        reference_id,
        gateway,
        status: 'PENDING',
      },
    });

    let paymentResult;

    try {
      switch (gateway) {
        case PaymentGateway.STRIPE:
          paymentResult = await this.stripeGateway.createPaymentIntent(
            amount,
            currency,
            {
              user_id: userId.toString(),
              reference_id,
              transaction_id: transaction.id.toString(),
            },
          );

          return {
            transaction_id: transaction.id,
            gateway_response: paymentResult,
            client_secret: paymentResult.client_secret,
          };

        case PaymentGateway.PAYME:
          paymentResult = await this.paymeGateway.createPayment(
            amount,
            transaction.id.toString(),
            description || 'Flight booking payment',
          );

          return {
            transaction_id: transaction.id,
            payment_url: paymentResult.payment_url,
            gateway_response: paymentResult,
          };

        case PaymentGateway.CLICK:
          paymentResult = await this.clickGateway.createPayment(
            amount,
            transaction.id.toString(),
            description || 'Flight booking payment',
          );

          return {
            transaction_id: transaction.id,
            payment_url: paymentResult.payment_url,
            gateway_response: paymentResult,
          };
        default:
          throw new BadRequestException('Unsupported payment gateway');
      }
    } catch (error) {
      // Update transaction status to failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException(`Payment gateway error: ${error.message}`);
    }
  }
  async handleStripeWebhook(event: any) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transactionId = parseInt(paymentIntent.metadata.transaction_id, 10);
      await this.updateTransactionStatus(
        transactionId,
        'COMPLETED',
        paymentIntent,
      );
      this.eventEmitter.emit('payment.completed', {
        transactionId,
        paymentIntent,
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const transactionId = parseInt(paymentIntent.metadata.transaction_id, 10);
      await this.updateTransactionStatus(
        transactionId,
        'FAILED',
        paymentIntent,
      );
      this.eventEmitter.emit('payment.failed', {
        transactionId,
        paymentIntent,
      });
    }
  }
  private async updateTransactionStatus(
    transactionId: number,
    status: 'COMPLETED' | 'FAILED',
    gatewayResponse: any,
  ) {
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status, gateway_response: JSON.stringify(gatewayResponse) },
    });
  }
}
