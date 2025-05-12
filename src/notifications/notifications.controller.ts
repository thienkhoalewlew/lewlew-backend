import { Controller, Req, UseGuards, Param, Body, Post, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    constructor( private readonly notificationsService: NotificationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo thông báo mới' })
    @ApiResponse({ status: 201, description: 'Thông báo đã được tạo' })
    async createNotification(@Body() dto: CreateNotificationDto) {
        return this.notificationsService.createNotification(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get all notifications of current user" })
    @ApiResponse({ status: 200, description: "Notifications list" })
    async getNotifications(@Req() req) {
        return this.notificationsService.getNotificationsByRecipent(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Notification marked as read' })
    async markAsRead(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
        return this.notificationsService.markAsRead(id, dto);
    }
}
