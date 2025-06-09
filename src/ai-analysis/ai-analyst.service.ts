import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Interface cho response từ Sightengine API
export interface SightengineResponse {
  nudity?: {
    raw: number;
  };
  weapon?: number;
  alcohol?: number;
  drugs?: number;
  gore?: {
    prob: number;
  };
  offensive?: {
    prob: number;
  };
  scam?: {
    prob: number;
  };
  status: string;
  request?: any;
}

@Injectable()
export class AiAnalystService {
  private readonly logger = new Logger(AiAnalystService.name);
  private readonly sightengineApiUser: string;
  private readonly sightengineApiSecret: string;
  constructor(private configService: ConfigService) {
    this.sightengineApiUser = this.configService.get<string>('SIGHTENGINE_API_USER') || '';
    this.sightengineApiSecret = this.configService.get<string>('SIGHTENGINE_API_SECRET') || '';
    
    this.logger.log('🤖 AI Analyst Service initialized');
    
    // Log API configuration status
    if (this.sightengineApiUser && this.sightengineApiSecret) {
      this.logger.log(`🤖 AI Analysis - Sightengine API credentials configured successfully`);
      this.logger.log(`🤖 AI Analysis - API User: ${this.sightengineApiUser.substring(0, 8)}...`);
      this.logger.log(`🤖 AI Analysis - Service ready for image analysis`);
    } else {
      this.logger.warn(`🤖 AI Analysis - WARNING: Sightengine API credentials not configured`);
      this.logger.warn(`🤖 AI Analysis - User: ${this.sightengineApiUser ? 'SET' : 'NOT SET'}`);
      this.logger.warn(`🤖 AI Analysis - Secret: ${this.sightengineApiSecret ? 'SET' : 'NOT SET'}`);
      this.logger.warn(`🤖 AI Analysis - AI analysis will not work without proper credentials`);
    }
  }

  /**
   * Phân tích ảnh sử dụng Sightengine API
   * @param imageUrl URL của ảnh cần phân tích
   * @param reportReason Lý do báo cáo
   * @returns Kết quả phân tích
   */  async analyzeImage(imageUrl: string, reportReason: string) {
    try {
      this.logger.log(`🤖 AI Analysis - Starting image analysis for URL: ${imageUrl}`);
      this.logger.log(`🤖 AI Analysis - Report reason: ${reportReason}`);
      
      if (!this.sightengineApiUser || !this.sightengineApiSecret) {
        this.logger.warn('🤖 AI Analysis - Sightengine API credentials not configured');
        return {
          isViolation: false,
          confidence: 0,
          message: 'API credentials not configured'
        };
      }

      this.logger.log(`🤖 AI Analysis - API credentials configured successfully`);
      this.logger.log(`🤖 AI Analysis - API User: ${this.sightengineApiUser.substring(0, 8)}...`);

      const params = new URLSearchParams();
      params.append('api_user', this.sightengineApiUser);
      params.append('api_secret', this.sightengineApiSecret);
      params.append('url', imageUrl);
      
      // Chọn models dựa trên lý do báo cáo
      let models = 'nudity,wad,offensive,gore';
      
      if (reportReason === 'spam') {
        models += ',scam';
      }
      
      if (reportReason === 'hate_speech' || reportReason === 'harassment') {
        models += ',offensive';
      }
        params.append('models', models);
      
      this.logger.log(`🤖 AI Analysis - Selected models: ${models}`);
      this.logger.log(`🤖 AI Analysis - Making request to Sightengine API...`);
      
      const startTime = Date.now();
      const response = await axios.get('https://api.sightengine.com/1.0/check.json', { params });
      const endTime = Date.now();
      
      this.logger.log(`🤖 AI Analysis - API response received in ${endTime - startTime}ms`);
      this.logger.log(`🤖 AI Analysis - Response status: ${response.status}`);
      
      if (response.status !== 200) {
        this.logger.error(`🤖 AI Analysis - Sightengine API returned status ${response.status}`);
        throw new Error(`Sightengine API returned status ${response.status}`);
      }

      const data: SightengineResponse = response.data as SightengineResponse;
        // Log raw API response data
      this.logger.log(`🤖 AI Analysis - Raw API response status: ${data.status}`);
      if (data.nudity) {
        this.logger.log(`🤖 AI Analysis - Nudity detection: ${data.nudity.raw}`);
      }
      if (data.weapon) {
        this.logger.log(`🤖 AI Analysis - Weapon detection: ${data.weapon}`);
      }
      if (data.gore) {
        this.logger.log(`🤖 AI Analysis - Gore detection: ${JSON.stringify(data.gore)}`);
        this.logger.log(`🤖 AI Analysis - Gore probability: ${data.gore.prob}`);
      }
      if (data.offensive) {
        this.logger.log(`🤖 AI Analysis - Offensive content: ${data.offensive.prob}`);
      }
      if (data.scam) {
        this.logger.log(`🤖 AI Analysis - Scam detection: ${data.scam.prob}`);
      }
      
      // Xác định nếu ảnh vi phạm chính sách dựa trên lý do báo cáo
      let isViolation = false;      let confidence = 0;
      let violationType = '';
      let message = '';

      this.logger.log(`🤖 AI Analysis - Analyzing results for report reason: ${reportReason}`);

      // Kiểm tra các loại vi phạm khác nhau dựa trên lý do báo cáo
      switch (reportReason) {
        case 'inappropriate_content':
          this.logger.log(`🤖 AI Analysis - Checking inappropriate content (nudity threshold: 0.6)`);
          if (data.nudity && data.nudity.raw > 0.6) {
            isViolation = true;
            confidence = data.nudity.raw;
            violationType = 'nudity';
            message = `Phát hiện nội dung khỏa thân với độ tin cậy ${Math.round(confidence * 100)}%`;
            this.logger.log(`🤖 AI Analysis - VIOLATION DETECTED: ${message}`);
          } else {
            this.logger.log(`🤖 AI Analysis - No inappropriate content violation detected`);
          }
          break;
          case 'violence':
          this.logger.log(`🤖 AI Analysis - Checking violence content (weapon/gore: 0.6, alcohol/drugs: 0.7)`);
          if ((data.weapon && data.weapon > 0.6) || 
              (data.alcohol && data.alcohol > 0.7) || 
              (data.drugs && data.drugs > 0.7) || 
              (data.gore && data.gore.prob > 0.6)) {
            isViolation = true;
            confidence = Math.max(data.weapon || 0, data.alcohol || 0, data.drugs || 0, data.gore?.prob || 0);
            violationType = 'violence_dangerous';
            message = `Phát hiện nội dung bạo lực hoặc nguy hiểm với độ tin cậy ${Math.round(confidence * 100)}%`;
            this.logger.log(`🤖 AI Analysis - VIOLATION DETECTED: ${message}`);
            this.logger.log(`🤖 AI Analysis - Violence scores - Weapon: ${data.weapon || 0}, Gore: ${data.gore?.prob || 0}, Alcohol: ${data.alcohol || 0}, Drugs: ${data.drugs || 0}`);
          } else {
            this.logger.log(`🤖 AI Analysis - No violence violation detected`);
            this.logger.log(`🤖 AI Analysis - Violence scores - Weapon: ${data.weapon || 0}, Gore: ${data.gore?.prob || 0}, Alcohol: ${data.alcohol || 0}, Drugs: ${data.drugs || 0}`);
          }
          break;
          
        // Thêm case riêng cho nội dung máu me kinh dị với ngưỡng thấp hơn
        case 'gore':
        case 'blood':
        case 'graphic_violence':
          this.logger.log(`🤖 AI Analysis - Checking gore/blood content (gore threshold: 0.3, weapon: 0.4)`);
          if ((data.gore && data.gore.prob > 0.3) || 
              (data.weapon && data.weapon > 0.4)) {
            isViolation = true;
            confidence = Math.max(data.gore?.prob || 0, data.weapon || 0);
            violationType = 'gore_blood';
            message = `Phát hiện nội dung máu me/kinh dị với độ tin cậy ${Math.round(confidence * 100)}%`;
            this.logger.log(`🤖 AI Analysis - GORE/BLOOD VIOLATION DETECTED: ${message}`);
            this.logger.log(`🤖 AI Analysis - Gore/Blood scores - Gore: ${data.gore?.prob || 0}, Weapon: ${data.weapon || 0}`);
          } else {
            this.logger.log(`🤖 AI Analysis - No gore/blood violation detected`);
            this.logger.log(`🤖 AI Analysis - Gore/Blood scores - Gore: ${data.gore?.prob || 0}, Weapon: ${data.weapon || 0}`);
          }
          break;
            case 'hate_speech':
        case 'harassment':
          this.logger.log(`🤖 AI Analysis - Checking offensive content (threshold: 0.7)`);
          if (data.offensive && data.offensive.prob > 0.7) {
            isViolation = true;
            confidence = data.offensive.prob;
            violationType = 'offensive';
            message = `Phát hiện nội dung xúc phạm với độ tin cậy ${Math.round(confidence * 100)}%`;
            this.logger.log(`🤖 AI Analysis - VIOLATION DETECTED: ${message}`);
          } else {
            this.logger.log(`🤖 AI Analysis - No offensive content violation detected`);
          }
          break;
          
        case 'spam':
          this.logger.log(`🤖 AI Analysis - Checking spam content (threshold: 0.7)`);
          if (data.scam && data.scam.prob > 0.7) {
            isViolation = true;
            confidence = data.scam.prob;
            violationType = 'spam';
            message = `Phát hiện nội dung spam với độ tin cậy ${Math.round(confidence * 100)}%`;
            this.logger.log(`🤖 AI Analysis - VIOLATION DETECTED: ${message}`);
          } else {
            this.logger.log(`🤖 AI Analysis - No spam violation detected`);
          }
          break;
            default:
          this.logger.log(`🤖 AI Analysis - Checking general policy violations (threshold: 0.8)`);
          // Đối với 'other' hoặc lý do không xác định, sử dụng kiểm tra chung
          if ((data.nudity && data.nudity.raw > 0.8) || 
              (data.weapon && data.weapon > 0.8) || 
              (data.alcohol && data.alcohol > 0.8) || 
              (data.drugs && data.drugs > 0.8) ||
              (data.offensive && data.offensive.prob > 0.8)) {
            isViolation = true;
            confidence = Math.max(
              data.nudity?.raw || 0, 
              data.weapon || 0, 
              data.alcohol || 0, 
              data.drugs || 0,
              data.offensive?.prob || 0
            );
            violationType = 'policy_violation';
            message = `Phát hiện vi phạm chính sách với độ tin cậy ${Math.round(confidence * 100)}%`;
            this.logger.log(`🤖 AI Analysis - VIOLATION DETECTED: ${message}`);
          } else {
            this.logger.log(`🤖 AI Analysis - No general policy violation detected`);
          }
      }

      // Log final analysis result
      this.logger.log(`🤖 AI Analysis - Final Result: isViolation=${isViolation}, confidence=${confidence}, violationType=${violationType}`);
      this.logger.log(`🤖 AI Analysis - Analysis completed successfully`);

      return {
        isViolation,
        confidence,
        violationType,
        message,
        rawData: data,
        provider: 'sightengine',
        timestamp: new Date()
      };
    } catch (error: any) {
      this.logger.error(`🤖 AI Analysis - ERROR: Failed to analyze image: ${error.message}`);
      this.logger.error(`🤖 AI Analysis - Error stack: ${error.stack}`);
      
      // Check if it's a network error
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        this.logger.error(`🤖 AI Analysis - Network error: Cannot connect to Sightengine API`);
      }
      
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        this.logger.error(`🤖 AI Analysis - Authentication error: Invalid API credentials`);
      }
      
      return {
        isViolation: false,
        confidence: 0,
        message: `Lỗi phân tích ảnh: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Kiểm tra nếu nội dung cần xóa tự động dựa trên độ tin cậy
   * @param confidence Độ tin cậy từ phân tích
   * @returns Boolean cho biết có nên xóa tự động không
   */
  shouldAutoDelete(confidence: number): boolean {
    // Xóa tự động nếu độ tin cậy >= 80%
    return confidence >= 0.8;
  }
} 