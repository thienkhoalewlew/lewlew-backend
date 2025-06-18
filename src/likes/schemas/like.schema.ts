import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Post } from '../../posts/schemas/post.schema';
import { Comment } from '../../comments/schemas/comment.schema';

export type LikeDocument = Like & Document;

@Schema({ 
  timestamps: true,
  collection: 'likes' // Explicitly specify collection name
})
export class Like {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post' })
  post?: Post;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Comment' })
  comment?: Comment;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ 
    type: String, 
    enum: ['post', 'comment'], 
    required: true 
  })
  likeType: 'post' | 'comment';

  @Prop({ default: Date.now })
  likedAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Ensure all old fields are not included by explicitly setting schema options
LikeSchema.set('strict', true);

// Index riêng biệt cho post và comment để tránh conflict
// Index cho post likes
LikeSchema.index(
  { post: 1, user: 1 }, 
  { 
    unique: true, 
    sparse: true,
    name: 'post_user_unique'
  }
);

// Index cho comment likes  
LikeSchema.index(
  { comment: 1, user: 1 }, 
  { 
    unique: true, 
    sparse: true,
    name: 'comment_user_unique'
  }
);

// Index để query likes của 1 post
LikeSchema.index({ post: 1, likedAt: -1 });

// Index để query likes của 1 comment
LikeSchema.index({ comment: 1, likedAt: -1 });

// Index để query likes của 1 user
LikeSchema.index({ user: 1, likedAt: -1 });

// Index để count likes theo post/comment
LikeSchema.index({ post: 1, likeType: 1 });
LikeSchema.index({ comment: 1, likeType: 1 });
