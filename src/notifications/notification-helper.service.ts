import { Injectable } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class NotificationHelperService {
    constructor(private readonly notificationService: NotificationsService){}    async createFriendRequestNotification(senderId: string, recipientId: string): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_request',
            message: 'đã gửi lời mời kết bạn cho bạn',

        });
    }

    async createFriendAcceptNotification(senderId: string, recipientId: string): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'friend_accept',
            message: 'đã chấp nhận lời mời kết bạn của bạn',
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
            message: 'đã thích bài viết của bạn',
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
            message: 'đã bình luận bài viết của bạn',
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
            message: 'đã đăng bài gần bạn',
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
            message: 'đã đăng bài viết mới',
            postId,
        });
    }async createCommentLikeNotification(
        senderId: string,
        recipientId: string,
        postId: string,
        commentId: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId,
            senderId,
            type: 'comment_like',
            message: 'đã thích bình luận của bạn',
            postId,
            commentId,
        });
    }async createPostRemovedNotification(
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
     */    async createReportApprovedNotification(
        reporterId: string,
        postId: string,
        reportReason: string
    ): Promise<void> {
        await this.notificationService.createNotification({
            recipientId: reporterId,
            senderId: undefined, // System notification
            type: 'report_approved',
            message: `Báo cáo của bạn về "${reportReason}" đã được xem xét và nội dung đã bị xóa. Cảm ơn bạn đã giúp giữ cộng đồng an toàn.`,
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
        const baseMessage = `Báo cáo của bạn về "${reportReason}" đã được xem xét và được xác định không vi phạm quy tắc cộng đồng của chúng tôi.`;
        const fullMessage = adminNotes 
            ? `${baseMessage} Ghi chú của quản trị viên: ${adminNotes}`
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
            message: `Báo cáo của bạn về "${reportReason}" đang được nhóm kiểm duyệt xem xét. Chúng tôi sẽ thông báo khi có kết quả.`,
            postId,
        });
    }
}