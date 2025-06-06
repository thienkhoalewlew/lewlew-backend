import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDocument } from './schemas/user.schema';
import { FriendRelation } from '../friendrelations/schemas/friendrelation.schema';
import { Model, set } from 'mongoose';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CurrentUserProfileDto, OtherUserProfileDto } from './dto/user-profile.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UploadsService } from '../uploads/uploads.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FriendRelation.name) private friendRelationModel: Model<FriendRelation>,
    private readonly uploadsService: UploadsService,
  ) {}

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

  async getCurrentUserProfile(userId: string): Promise<CurrentUserProfileDto> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cant find user with id: ${userId}`);
    }
    
    return {
      _id: (user._id as unknown as string),
      fullname: user.fullName,
      avatar: user.avatar,
      email: user.email,
      bio: user.bio,
      friendCount: user.friends.length || 0,
    }
  }

  async getOtherUserProfile(userId: string, targetUserId: string): Promise<OtherUserProfileDto> {
    const user = await this.userModel.findById(targetUserId).exec();
    if (!user) {
      throw new NotFoundException(`Cant find user with id: ${targetUserId}`);
    }

    const friendRelation = await this.friendRelationModel.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId },
      ],
    }).exec();

    let friendStatus: 'none' | 'pending' | 'accept' | 'reject' = 'none';
    if (friendRelation && friendRelation.status) {
      // Kiểm tra và ép kiểu giá trị của friendRelation.status
      if (['none', 'pending', 'accepted', 'reject'].includes(friendRelation.status)) {
        friendStatus = friendRelation.status as 'none' | 'pending' | 'accept' | 'reject';
      }
    }

    return {
      _id: (user._id as unknown as string),
      fullname: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      friendCount: user.friends?.length || 0,
      friendStatus: friendStatus,
    };
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastActive: new Date() })
      .exec();
  }

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.avatar = avatar;
    await user.save();

    // Lưu thông tin ảnh vào uploads collection nếu có avatar URL từ Cloudinary
    if (avatar && avatar.includes('cloudinary.com')) {
      try {
        await this.uploadsService.saveImangeInfo({
          url: avatar,
          filename: `avatar_${userId}.jpg`,
          originalname: `user_avatar_${userId}.jpg`,
          mimetype: 'image/jpeg',
          size: 0, // Size sẽ được cập nhật từ Cloudinary metadata nếu cần
          metadata: {
            type: 'user_avatar',
            userId: userId,
            uploadedAt: new Date(),
          }
        }, userId);
      } catch (error) {
        console.error('Error saving avatar image info to uploads:', error);
        // Không throw error để không ảnh hưởng đến việc cập nhật avatar
      }
    }
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    if (!user.password) {
      throw new Error('User does not have a password set');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
  }

  async updateEmail(userId: string, dto: UpdateEmailDto): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.email = dto.email;
    await user.save();
  }

  async updateUsername(userId: string, dto: UpdateUsernameDto): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.fullName = dto.username;
    await user.save();
  }

  async updateSettings(userId: string, settings: UpdateSettingsDto): Promise<void> {
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
