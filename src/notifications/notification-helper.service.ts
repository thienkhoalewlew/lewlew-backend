import { Injectable } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { ReportReason } from "../reports/schemas/report.schema";

@Injectable()
export class NotificationHelperService {
    constructor(private readonly notificationService: NotificationsService) {}

    async createFriendRequestNotification(senderId: string, recipientId: string): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_request',
            message: 'friendRequest',
        });
    }

    async createFriendAcceptNotification(senderId: string, recipientId: string): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_accept',
            message: 'friendAccept',
        });
    }    async createPostLikeNotification(
        senderId: string,
        recipientId: string,
        postId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'like',
            message: 'postLike',
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
            message: 'postComment',
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
            message: 'nearbyPost',
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
            message: 'friendPost',
            postId,
        });
    }

    async createCommentLikeNotification(
        senderId: string,
        recipientId: string,
        postId: string,
        commentId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'comment_like',
            message: 'commentLike',
            postId,
            commentId,
        });
    }
    async createPostRemovedNotification(
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
        reportReason: ReportReason | string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_approved',
            message: `reportApproved|${reportReason}`,
            postId,
        });
    }    /**
     * Thông báo cho người report khi report bị từ chối
     */
    async createReportRejectedNotification(
        reporterId: string,
        postId: string,
        reportReason: ReportReason | string,
        adminNotes?: string
    ): Promise<void> {
        // Encode data into message format: messageKey|reportReason|adminNotes
        const messageData = adminNotes 
            ? `reportRejected|${reportReason}|${adminNotes}`
            : `reportRejected|${reportReason}`;

        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_rejected',
            message: messageData,
            postId,
        });
    }    /**
     * Thông báo cho người report khi report đang được xem xét
     */
    async createReportUnderReviewNotification(
        reporterId: string,
        postId: string,
        reportReason: ReportReason | string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_under_review',
            message: `reportUnderReview|${reportReason}`,
            postId,
        });
    }
}