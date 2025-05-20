import { 
  Controller, 
  Req, 
  UseGuards, 
  Param, 
  Body, 
  Post, 
  Get, 
  Patch 
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new notification' })
  @ApiResponse({ status: 201, description: 'Notification has been created' })
  async createNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }
    @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications of current user' })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  async getNotifications(@Req() req) {
    console.log('Get notifications request from user:', req.user);
    return this.notificationsService.getNotificationsByRecipent(req.user.userId || req.user.id);
  }
  
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.markAsRead(id, dto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread notification count' })
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }
  
  @UseGuards(JwtAuthGuard)
  @Patch('mark-all-read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'Tất cả thông báo đã được đánh dấu đã đọc' };
  }
}