import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaymeGateway {
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get(
      'PAYME_BASE_URL',
      'https://checkout.paycom.uz',
    )!;
    this.merchantId = this.configService.get('PAYME_MERCHANT_ID')!;
    this.secretKey = this.configService.get('PAYME_SECRET_KEY')!;
  }

  async createPayment(amount: number, orderId: string, description: string) {
    const url = `${this.baseUrl}/${this.merchantId}`;

    const params = {
      m: this.merchantId,
      ac: { order_id: orderId },
      a: amount * 100, // Convert to tiyin
      c: description,
      cr: 'UZS',
      l: 'uz',
    };

    const paramString = btoa(JSON.stringify(params));

    return {
      payment_url: `${url}?${paramString}`,
      order_id: orderId,
      amount,
    };
  }

  async checkPayment(paymentId: string) {
    // Implement Payme API call to check payment status
    try {
      const response = await axios.post(
        `${this.baseUrl}/api`,
        {
          method: 'CheckTransaction',
          params: { id: paymentId },
        },
        {
          headers: {
            Authorization: `Basic ${btoa(this.merchantId + ':' + this.secretKey)}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Payme API error: ${error.message}`);
    }
  }
}
