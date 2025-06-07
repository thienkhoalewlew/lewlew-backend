import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: false, unique: true, sparse: true })
  username: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: null })
  verificationCode?: string;

  @Prop({ default: null })
  verificationCodeExpires?: Date;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ default: false })
  isTemporary: boolean;

  @Prop({ required: false })
  bio?: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  friends: User[];

  @Prop({
    type: [
      {
        from: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  })
  friendRequests: Array<{ from: User; createdAt: Date }>;

  @Prop({
    type: {
      notificationRadius: { type: Number, default: 5 },
      language: { type: String, enum: ['en', 'vi'], default: 'vi' }
    },
    default: {
      notificationRadius: 5,
      language: 'vi'
    }
  })
  settings: {
    notificationRadius: number;
    language: 'en' | 'vi';
  };

  @Prop()
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Thêm indexes
UserSchema.index({ phoneNumber: 1 });
UserSchema.index({ 'location.coordinates': '2dsphere' });

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

UserSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});
