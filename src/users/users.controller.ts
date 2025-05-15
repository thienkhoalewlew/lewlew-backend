import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserProfileDto } from './dto/user-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto'
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

@UseGuards(JwtAuthGuard)
@Get('profile')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get user profile - current user or by ID' })
@ApiQuery({ name: 'userId', required: false, description: 'Optional user ID to get profile. If not provided, returns current user profile.' })
@ApiResponse({ status: 200, description: 'User profile', type: CurrentUserProfileDto })
@ApiResponse({ status: 404, description: 'User not found' })
async getProfile(@Req() req, @Query('userId') userId?: string) {
  if (userId) {
    // Lấy thông tin người dùng khác
    return this.userService.getOtherUserProfile(req.user.userId, userId);
  } else {
    // Lấy thông tin người dùng hiện tại 
    return this.userService.getCurrentUserProfile(req.user.userId);
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
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async updatePassword(@Req() req, @Body() dto: UpdatePasswordDto) {
    await this.userService.updatePassword(req.user.userId, dto);
    return { message: 'Password updated successfully' };
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
  @Patch('update_email')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email' })
  async updateEmail(@Req() req, @Body() dto: UpdateEmailDto) {
    await this.userService.updateEmail(req.user.userId, dto);
    return { message: 'Email updated successfully' };
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
