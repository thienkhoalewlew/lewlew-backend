import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
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
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  lastActive: Date;
}
