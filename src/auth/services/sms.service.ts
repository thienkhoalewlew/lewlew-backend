import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private vonageClient: Vonage;  private readonly smsEnabled: boolean;
  constructor(private configService: ConfigService) {
    this.smsEnabled = this.configService.get<string>('SMS_ENABLED') === 'true';
    
    if (this.smsEnabled) {
      const apiKey = this.configService.get<string>('VONAGE_API_KEY');
      const apiSecret = this.configService.get<string>('VONAGE_API_SECRET');
      
      if (apiKey && apiSecret) {
        this.vonageClient = new Vonage(
          new Auth({
            apiKey: apiKey,
            apiSecret: apiSecret
          })
        );
        this.logger.log('Vonage client initialized');
      } else {
        this.logger.error('Vonage credentials not found. SMS service disabled.');
      }
    } else {
      this.logger.log('SMS service disabled');
    }
  }
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!this.smsEnabled) {
      this.logger.error('SMS service is disabled');
      return false;
    }

    try {
      if (!this.vonageClient) {
        this.logger.error('Vonage not configured. Cannot send SMS.');
        return false;
      }

      const fromNumber = this.configService.get<string>('VONAGE_FROM_NUMBER') || 'LewLew';
      
      const response = await this.vonageClient.sms.send({
        to: phoneNumber,
        from: fromNumber,
        text: `Mã xác thực LewLew của bạn là: ${code}. Mã có hiệu lực trong 5 phút.`
      });

      if (response.messages[0].status === '0') {
        this.logger.log(`SMS sent successfully to ${phoneNumber}. Message ID: ${response.messages[0]['message-id']}`);
        return true;
      } else {
        this.logger.error(`Failed to send SMS to ${phoneNumber}. Error: ${response.messages[0]['error-text']}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return false;
    }
  }
  generateVerificationCode(): string {
    // Generate random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }  
  // Check service configuration
  getServiceMode(): { smsEnabled: boolean; provider: string } {
    return {
      smsEnabled: this.smsEnabled,
      provider: this.smsEnabled ? 'Vonage (Production)' : 'Disabled'
    };
  }
}
