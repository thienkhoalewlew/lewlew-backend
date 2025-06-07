import { Body, Controller, Get, Patch, Query, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserProfileDto } from './dto/user-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto'
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateFullnameDto } from './dto/update-fullname.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdateBioDto } from './dto/update-bio.dto';

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
  @Patch('update_avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  async updateAvatar(@Req() req, @Body() dto: UpdateAvatarDto) {
    await this.userService.updateAvatar(req.user.userId, dto.avatar);
    return { message: 'Avatar updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async updatePassword(@Req() req, @Body() dto: UpdatePasswordDto) {
    await this.userService.updatePassword(req.user.userId, dto);
    return { message: 'Password updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_fullname')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update full name' })
  async updateFullname(@Req() req, @Body() dto: UpdateFullnameDto) {
    await this.userService.updateFullname(req.user.userId, dto);
    return { message: 'Full name updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update username' })
  async updateUsername(@Req() req, @Body() dto: UpdateUsernameDto) {
    await this.userService.updateUsername(req.user.userId, dto);
    return { message: 'Username updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_bio')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user bio' })
  async updateBio(@Req() req, @Body() dto: UpdateBioDto) {
    await this.userService.updateBio(req.user.userId, dto);
    return { message: 'Bio updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(@Req() req, @Body() dto: UpdateSettingsDto) {
    await this.userService.updateSettings(req.user.userId, dto);
    return { message: 'Settings updated successfully' };
  }
}
