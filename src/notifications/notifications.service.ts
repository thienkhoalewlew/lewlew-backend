import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,    
    ) {}

    async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
        const notification = new this.notificationModel(dto);
        return notification.save();
    }

    async getNotificationsByRecipent(recipientId: string): Promise<NotificationDocument[]> {
        return this.notificationModel
        .find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .populate('sender', 'username avatar')
        .populate('post', 'image caption')
        .populate('comment', 'content')
        .exec();
    }

    async markAsRead(notificationId: string, dto: UpdateNotificationDto): Promise<Notification> {
        const notification = await this.notificationModel.findById(notificationId);
        if (!notification) {
        throw new NotFoundException('Notification not found');
        }

        notification.read = dto.read;
        return notification.save();
    }
}
