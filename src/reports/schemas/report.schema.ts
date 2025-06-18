import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  GORE = 'gore',
  BLOOD = 'blood',
  GRAPHIC_VIOLENCE = 'graphic_violence',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(ReportReason), 
    required: true 
  })
  reason: ReportReason;


  @Prop({ 
    type: String, 
    enum: Object.values(ReportStatus), 
    default: ReportStatus.PENDING 
  })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: String })
  reviewComment?: string;

  // AI Analysis fields
  @Prop({ type: Number, min: 0, max: 1 })
  aiConfidenceScore?: number;

  @Prop({ type: String })
  aiPrediction?: string;

  @Prop({ type: Object })
  aiAnalysis?: {
    textAnalysis?: {
      toxicity: number;
      spam: number;
      inappropriateContent: number;
      hateSpeech: number;
    };
    imageAnalysis?: {
      inappropriateContent: number;
      violence: number;
      nudity: number;
    };
    metadata?: any;
  };

  @Prop({ type: Boolean, default: false })
  autoResolved?: boolean;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Add indexes for better performance
ReportSchema.index({ postId: 1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ reason: 1 });
ReportSchema.index({ createdAt: -1 });
