import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private readonly socketGateway: SocketGateway,  
    ) {}    async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
        // Tạo notification với đúng cấu trúc
        const notification = new this.notificationModel({
            recipient: dto.recipientId,
            sender: dto.senderId,
            type: dto.type,
            message: dto.message,
            post: dto.postId,
            comment: dto.commentId,
            read: false,
            createdAt: new Date()
        });
        
        const savedNotification = await notification.save();

        // Populate dữ liệu trước khi gửi qua socket
        const populatedNotification = await this.notificationModel
        .findById(savedNotification._id)
        .populate('sender', 'username avatar')
        .populate('post', 'image caption')
        .populate('comment', 'content')
        .exec();

        // Gửi thông báo qua socket đến người nhận
        this.socketGateway.sendNotificationToUser(dto.recipientId, populatedNotification);

        return savedNotification;
    }    async getNotificationsByRecipent(recipientId: string): Promise<NotificationDocument[]> {
        console.log(`Looking for notifications where recipient equals: ${recipientId}`);
        
        // First try a count to see if we have any match
        const count = await this.notificationModel.countDocuments({ recipient: recipientId }).exec();
        console.log(`Found ${count} notifications for recipient ID: ${recipientId}`);
        
        // Try to find at least one notification without filter to check schema
        const sampleNotif = await this.notificationModel.findOne().exec();
        if (sampleNotif) {
            console.log('Sample notification structure:', {
                id: sampleNotif._id,
                recipient: sampleNotif.recipient,
                sender: sampleNotif.sender,
                type: sampleNotif.type
            });
        } else {
            console.log('No notifications found in the database at all');
        }
        
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
      throw new NotFoundException('Cannot find notification');
    }

    notification.read = dto.read;
    return notification.save();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipient: userId,
      read: false
    }).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    ).exec();
  }
}
