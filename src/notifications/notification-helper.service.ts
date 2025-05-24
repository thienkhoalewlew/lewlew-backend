import { Injectable } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class NotificationHelperService {
    constructor(private readonly notificationService: NotificationsService){}

    async createFriendRequestNotification(senderId: string, recipientId: string): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_request',
            message: 'has sent you a friend request',

        });
    }

    async createFriendAcceptNotification(senderId: string, recipientId: string): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_accept',
            message: 'has accepted your friend request',
        });
    }

    async createPostLikeNotification(
        senderId: string,
        recipientId: string,
        postId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'like',
            message: 'has liked your post',
            postId,
        });
    }

    async createPostCommentNotification(
        senderId: string,
        recipientId: string,
        postId: string,
        commentId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'comment',
            message: 'has commented on your post',
            postId,
            commentId,
        });
    }

    async createNearbyPostNotification(
        senderId: string,
        recipientId: string,
        postId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'nearby_post',
            message: 'has posted nearby you',
            postId,
        });
    }

    async createFriendPostNotification(
        senderId: string,
        recipientId: string,
        postId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_post',
            message: 'has posted a new post',
            postId,
        });
    }
}