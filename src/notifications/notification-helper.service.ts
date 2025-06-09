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
    }    async createPostRemovedNotification(
        recipientId: string,
        postId: string,
        reason: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId: undefined, // System notification
            type: 'post_removed',
            message: reason,
            postId,
        });
    }

    /**
     * Thông báo cho người report khi report được chấp nhận (post bị xóa)
     */
    async createReportApprovedNotification(
        reporterId: string,
        postId: string,
        reportReason: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_approved',
            message: `Your report for "${reportReason}" has been reviewed and the content has been removed. Thank you for helping keep our community safe.`,
            postId,
        });
    }

    /**
     * Thông báo cho người report khi report bị từ chối
     */
    async createReportRejectedNotification(
        reporterId: string,
        postId: string,
        reportReason: string,
        adminNotes?: string
    ): Promise<void> {
        const baseMessage = `Your report for "${reportReason}" has been reviewed and determined not to violate our community guidelines.`;
        const fullMessage = adminNotes 
            ? `${baseMessage} Admin notes: ${adminNotes}`
            : baseMessage;

        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_rejected',
            message: fullMessage,
            postId,
        });
    }

    /**
     * Thông báo cho người report khi report đang được xem xét
     */
    async createReportUnderReviewNotification(
        reporterId: string,
        postId: string,
        reportReason: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_under_review',
            message: `Your report for "${reportReason}" is being reviewed by our moderation team. We'll notify you once it's resolved.`,
            postId,
        });
    }
}