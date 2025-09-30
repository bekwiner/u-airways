// src/payment/gateways/click.gateway.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class ClickGateway {
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly serviceId: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get(
      'CLICK_BASE_URL',
      'https://api.click.uz',
    )!;
    this.merchantId = this.configService.get('CLICK_MERCHANT_ID')!;
    this.secretKey = this.configService.get('CLICK_SECRET_KEY')!;
    this.serviceId = this.configService.get('CLICK_SERVICE_ID')!;
  }

  async createPayment(amount: number, orderId: string, description: string) {
    const url = 'https://my.click.uz/services/pay';

    const params = {
      service_id: this.serviceId,
      merchant_id: this.merchantId,
      amount: amount.toString(),
      transaction_param: orderId,
      return_url: process.env.FRONTEND_URL + '/payment/success',
      cancel_url: process.env.FRONTEND_URL + '/payment/cancel',
    };

    return {
      payment_url: `${url}?${new URLSearchParams(params).toString()}`,
      order_id: orderId,
      amount,
    };
  }

  async checkPayment(clickTransId: string, merchantTransId: string) {
    const signString = `${clickTransId}${this.serviceId}${this.secretKey}${merchantTransId}`;
    const sign = crypto.createHash('md5').update(signString).digest('hex');

    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/merchant/payment/status`,
        {
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          service_id: this.serviceId,
          sign,
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Click API error: ${error.message}`);
    }
  }

  generateSign(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const signString =
      sortedKeys.map((key) => params[key]).join('') + this.secretKey;
    return crypto.createHash('md5').update(signString).digest('hex');
  }
}
