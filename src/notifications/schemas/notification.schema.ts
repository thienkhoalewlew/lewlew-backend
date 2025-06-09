import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Post } from '../../posts/schemas/post.schema';
import { Comment } from '../../comments/schemas/comment.schema';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', require: true })
  recipient: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  sender: User;
  @Prop({
    required: true,
    enum: [
      'like', 
      'comment', 
      'friend_request', 
      'friend_accept', 
      'nearby_post', 
      'friend_post', 
      'post_removed',
      'report_approved',
      'report_rejected', 
      'report_under_review'
    ],
  })
  type: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post' })
  post: Post;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Comment' })
  comment: Comment;

  @Prop()
  message: string;

  @Prop()
  read: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ createdAt: 1 });
