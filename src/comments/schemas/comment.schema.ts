import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Post } from '../../posts/schemas/post.schema';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post', required: true })
  post: Post;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  @Prop({ required: false })
  text: string;

  @Prop({ required: false })
  image: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  likes: User[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop()
  createdAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ post: 1 });
CommentSchema.index({ user: 1 });
CommentSchema.index({ createdAt: -1 });
