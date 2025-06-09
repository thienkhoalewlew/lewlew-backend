import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAnalystService } from './ai-analyst.service';

@Module({
  imports: [ConfigModule],
  providers: [AiAnalystService],
  exports: [AiAnalystService]
})
export class AiAnalysisModule {} 