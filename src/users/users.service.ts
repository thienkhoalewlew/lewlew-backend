import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { UserDocument } from './schemas/user.schema';
import { FriendRelation } from '../friendrelations/schemas/friendrelation.schema';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CurrentUserProfileDto, OtherUserProfileDto } from './dto/user-profile.dto';
import { UploadsService } from '../uploads/uploads.service';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto, UpdateType } from './dto/update-profile.dto';
import { 
  UpdatePasswordType,
  UpdateFullnameType,
  UpdateUsernameType,
  UpdateBioType,
  UpdateSettingsType
} from './interfaces/update-types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FriendRelation.name) private friendRelationModel: Model<FriendRelation>,
    private readonly uploadsService: UploadsService,
  ) {}

  async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ 
      phoneNumber,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: id,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (!user) {
      throw new NotFoundException(`Cant find user with id: ${id}`);
    }
    return user;
  }

  async getCurrentUserProfile(userId: string): Promise<CurrentUserProfileDto> {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (!user) {
      throw new NotFoundException(`Cant find user with id: ${userId}`);
    }
    
    return {
      _id: (user._id as unknown as string),
      username: user.username,
      fullname: user.fullName,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      friendCount: user.friends.length || 0,
    }
  }

  async getOtherUserProfile(userId: string, targetUserId: string): Promise<OtherUserProfileDto> {
    const user = await this.userModel.findOne({
      _id: targetUserId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
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
    let requestId: string | undefined = undefined;
    let isRequestSender: boolean | undefined = undefined;

    if (friendRelation && friendRelation.status) {
      // Kiểm tra và ép kiểu giá trị của friendRelation.status
      if (['none', 'pending', 'accepted', 'reject'].includes(friendRelation.status)) {
        friendStatus = friendRelation.status as 'none' | 'pending' | 'accept' | 'reject';
        
        // Nếu status là pending, cung cấp thông tin chi tiết
        if (friendRelation.status === 'pending') {
          requestId = (friendRelation._id as unknown as string);
          isRequestSender = friendRelation.requester.toString() === userId;
        }
      }
    }

    return {
      _id: (user._id as unknown as string),
      username: user.username,
      fullname: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      friendCount: user.friends?.length || 0,
      friendStatus: friendStatus,
      requestId: requestId,
      isRequestSender: isRequestSender,
    };
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastActive: new Date() })
      .exec();
  }

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
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

  async updatePassword(userId: string, dto: UpdatePasswordType): Promise<void> {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  async updateFullname(userId: string, dto: UpdateFullnameType): Promise<void> {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.fullName = dto.fullname;
    await user.save();
  }

  async updateUsername(userId: string, dto: UpdateUsernameType): Promise<void> {
    // Validate username format
    if (!dto.username || dto.username.trim().length === 0) {
      throw new BadRequestException('Username cannot be empty');
    }

    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    // Check if username already exists (exclude current user and temporary users)
    const existingUser = await this.userModel.findOne({ 
      username: dto.username.trim(),
      _id: { $ne: userId },
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Use findOneAndUpdate to avoid potential race conditions
    const updatedUser = await this.userModel.findOneAndUpdate(
      { 
        _id: userId,
        $or: [
          { isTemporary: { $exists: false } },
          { isTemporary: false }
        ]
      },
      { $set: { username: dto.username.trim() } },
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`Cannot update user with id: ${userId}`);
    }
  }

  async updateBio(userId: string, dto: UpdateBioType): Promise<void> {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (!user) {
      throw new NotFoundException(`Cannot find user with id: ${userId}`);
    }

    user.bio = dto.bio;
    await user.save();
  }

  async updateSettings(userId: string, settings: UpdateSettingsType): Promise<void> {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
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
