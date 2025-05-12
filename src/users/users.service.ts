import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDocument } from './schemas/user.schema';
import { Model, set } from 'mongoose';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import * as bcrypt from 'bcrypt';

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

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    if(!user.password) {
      throw new Error('User does not have a password set');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
  }

  async updateEmail(userId:string, dto: UpdateEmailDto): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.email = dto.email;
    await user.save();
  }

  async updateUsername(userId:string, dto: UpdateUsernameDto): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.fullName = dto.username;
    await user.save();
  }

  async updateSettings(userId:string, settings: UpdateSettingsDto): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.settings = {
      ...user.settings,
      ...settings,
    };
    await user.save();
  }
}
