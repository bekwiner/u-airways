import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { PaymeGateway } from './gateways/payme.gateway';
import { ClickGateway } from './gateways/click.gateway';

@Module({
  providers: [PaymentService, StripeGateway, PaymeGateway, ClickGateway],
  exports: [PaymentService],
})
export class PaymentModule {}
