import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportReason } from '../schemas/report.schema';

export class CreateReportDto {
  @ApiProperty({ 
    description: 'ID of the post being reported',
    example: '6571a2d3e87cf87df032a9b2'
  })
  @IsNotEmpty()
  @IsString()
  postId: string;

  @ApiProperty({ 
    description: 'Reason for reporting',
    enum: ReportReason,
    example: ReportReason.SPAM
  })
  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({ 
    description: 'Additional description (optional)',
    maxLength: 500,
    required: false,
    example: 'This post contains inappropriate content that violates community guidelines.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
