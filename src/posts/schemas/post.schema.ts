import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  image: string;

  @Prop()
  caption: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: { type: [Number], required: true },
    placeName: String,
  })
  location: {
    type: string;
    coordinates: number[];
    placeName: string;
  };

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  likes: User[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  createdAt: Date;
}
export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ user: 1 });
PostSchema.index({ 'location.coordinates': '2dsphere' });
PostSchema.index({ expiresAt: 1 });
PostSchema.index({ createdAt: 1 });
