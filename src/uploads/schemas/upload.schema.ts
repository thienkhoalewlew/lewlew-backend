import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import * as mongoose from 'mongoose';

export type UploadDocument = Upload & Document;

@Schema({ timestamps: true })
export class Upload {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalname: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  size: number;

  @Prop({
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UploadSchema = SchemaFactory.createForClass(Upload);

UploadSchema.index({ user: 1 });
UploadSchema.index({ status: 1 });
UploadSchema.index({ createdAt: -1 });
