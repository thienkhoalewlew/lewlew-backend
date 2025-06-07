import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private readonly isDevelopment: boolean;
  private readonly smsEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('DEVELOPMENT_MODE') === 'true';
    this.smsEnabled = this.configService.get<string>('SMS_ENABLED') === 'true';
    
    if (this.smsEnabled && !this.isDevelopment) {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      
      if (accountSid && authToken) {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized for production');
      } else {
        this.logger.warn('Twilio credentials not found, falling back to development mode');
      }
    } else {
      this.logger.log('SMS Service running in DEVELOPMENT MODE - No real SMS will be sent');
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    if (this.isDevelopment || !this.smsEnabled) {
      // Mock SMS sending trong development
      this.logger.warn(`🚀 DEVELOPMENT MODE: SMS to ${phoneNumber}`);
      this.logger.warn(`📱 Verification Code: ${code}`);
      this.logger.warn(`⏰ Code expires in 5 minutes`);
      this.logger.warn(`🔧 Change SMS_ENABLED=true in .env to use real SMS`);
      
      // Giả lập delay của SMS thật
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    try {
      if (!this.twilioClient) {
        this.logger.warn('Twilio not configured. Skipping SMS send.');
        return false;
      }

      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      
      const message = await this.twilioClient.messages.create({
        body: `Mã xác thực LewLew của bạn là: ${code}. Mã có hiệu lực trong 5 phút.`,
        from: fromNumber,
        to: phoneNumber
      });

      this.logger.log(`SMS sent successfully to ${phoneNumber}. Message SID: ${message.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return false;
    }
  }

  generateVerificationCode(): string {
    if (this.isDevelopment) {
      // Sử dụng mã cố định trong development
      const fixedCode = this.configService.get<string>('FIXED_VERIFICATION_CODE') || '123456';
      this.logger.log(`Generated FIXED verification code: ${fixedCode}`);
      return fixedCode;
    }
    
    // Tạo mã ngẫu nhiên cho production
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Phương thức để kiểm tra mode hiện tại
  getServiceMode(): { isDevelopment: boolean; smsEnabled: boolean; provider: string } {
    return {
      isDevelopment: this.isDevelopment,
      smsEnabled: this.smsEnabled,
      provider: this.isDevelopment ? 'Mock (Development)' : 'Twilio (Production)'
    };
  }
}
