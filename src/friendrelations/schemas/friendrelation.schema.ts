import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type FriendRelationDocument = FriendRelation & Document;

@Schema({ timestamps: true })
export class FriendRelation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user1: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user2: User;

  @Prop({ required: true, enum: ['pending', 'accepted', 'rejected'] })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  requester: User;

  @Prop()
  createdAt: Date;
}

export const FriendRelationSchema =
  SchemaFactory.createForClass(FriendRelation);

FriendRelationSchema.index({ user1: 1, user2: 1 }, { unique: true });
FriendRelationSchema.index({ user2: 1, user1: 1 });
FriendRelationSchema.index({ status: 1 });
