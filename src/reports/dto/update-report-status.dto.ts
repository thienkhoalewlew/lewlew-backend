import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from '../schemas/report.schema';

export class UpdateReportStatusDto {
  @ApiProperty({ 
    description: 'New status for the report',
    enum: ReportStatus,
    example: ReportStatus.RESOLVED
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({ 
    description: 'Comment from reviewer (optional)',
    maxLength: 500,
    required: false,
    example: 'Report reviewed and action taken.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewComment?: string;
}
