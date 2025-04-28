import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile - current user or by ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional user ID to get profile. If not provided, returns current user profile.' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Req() req, @Query('userId') userId?: string) {
    // Nếu không có userId trong query, lấy profile của người dùng hiện tại
    const targetUserId = userId || req.user.userId;
    return this.userService.getProfile(targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  async updateAvatar(@Req() req, @Body() dto: UpdateAvatarDto) {
    await this.userService.updateAvatar(req.user.userId, dto.avatar);
    return { message: 'Avatar updated successfully' };
  }
}
