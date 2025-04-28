import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Cant find user with id: ${id}`);
    }
    return user;
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }
    return {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      profileImage: user.avatar,
      bio: user.bio,
      postCount: 0,
      friendCount: user.friends ? user.friends.length : 0,
    };
  }

  async updateLastAcitve(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastActive: new Date() })
      .exec();
  }

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }
    user.avatar = avatar;
    await user.save();
  }
}
