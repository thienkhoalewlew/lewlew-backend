import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  phoneNumber: string;
  password?: string;
  avatar: string;
  location: {
    type: string;
    coordinates: number[];
  };
  friends: IUser[];
  friendRequests: Array<{ from: IUser; createdAt: Date }>;
  settings: {
    notificationRadius: number;
    language: string;
  };
  lastActive: Date;
}
