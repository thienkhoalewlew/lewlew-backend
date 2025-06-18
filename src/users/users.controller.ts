import { Body, Controller, Get, Patch, Query, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto, UpdateType } from './dto/update-profile.dto';
import { 
  UpdateSettingsType
} from './interfaces/update-types';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID of the user to get profile for (if not provided, returns current user profile)' })
  async getCurrentUserProfile(@Req() req, @Query('userId') userId?: string) {
    if (userId) {
      // Lấy profile của user khác
      return await this.userService.getOtherUserProfile(req.user.userId, userId);
    } else {
      // Lấy profile của user hiện tại
      const user = await this.userService.findById(req.user.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile with different update types' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    const userId = req.user.userId;

    switch (dto.updateType) {
      case UpdateType.AVATAR:
        if (!dto.avatar) {
          throw new BadRequestException('Avatar URL is required for avatar update');
        }
        await this.userService.updateAvatar(userId, dto.avatar);
        return { message: 'Cập nhật ảnh đại diện thành công' };

      case UpdateType.PASSWORD:
        if (!dto.currentPassword || !dto.newPassword) {
          throw new BadRequestException('Current password and new password are required for password update');
        }
        await this.userService.updatePassword(userId, {
          currentPassword: dto.currentPassword,
          newPassword: dto.newPassword
        });
        return { message: 'Cập nhật mật khẩu thành công' };

      case UpdateType.FULLNAME:
        if (!dto.fullname) {
          throw new BadRequestException('Fullname is required for fullname update');
        }
        await this.userService.updateFullname(userId, { fullname: dto.fullname });
        return { message: 'Cập nhật họ tên thành công' };

      case UpdateType.USERNAME:
        if (!dto.username) {
          throw new BadRequestException('Username is required for username update');
        }
        await this.userService.updateUsername(userId, { username: dto.username });
        return { message: 'Cập nhật tên người dùng thành công' };

      case UpdateType.BIO:
        if (dto.bio === undefined) {
          throw new BadRequestException('Bio is required for bio update');
        }
        await this.userService.updateBio(userId, { bio: dto.bio });
        return { message: 'Cập nhật tiểu sử thành công' };

      case UpdateType.SETTINGS:
        const settings: UpdateSettingsType = {};
        if (dto.notificationRadius !== undefined) {
          settings.notificationRadius = dto.notificationRadius;
        }
        if (dto.language !== undefined) {
          settings.language = dto.language;
        }
        await this.userService.updateSettings(userId, settings);
        return { message: 'Cập nhật cài đặt thành công' };

      default:
        throw new BadRequestException('Invalid update type');
    }
  }
}
