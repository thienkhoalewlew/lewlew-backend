import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: false, unique: true })
  username: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: '' })
  avatar: string;

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
      pushNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      language: { type: String, enum: ['en', 'vi'], default: 'vi' }
    },
    default: {
      notificationRadius: 5,
      pushNotifications: true,
      emailNotifications: true,
      language: 'vi'
    }
  })
  settings: {
    notificationRadius: number;
    pushNotifications: boolean;
    emailNotifications: boolean;
    language: 'en' | 'vi';
  };

  @Prop()
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Thêm indexes
UserSchema.index({ email: 1 });
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
