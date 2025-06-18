import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { UploadsService } from '../uploads/uploads.service';
import { LikesService } from '../likes/likes.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly notificationHelper: NotificationHelperService,
    private readonly uploadsService: UploadsService,
    private readonly likesService: LikesService,
  ) {}
  async createComment(createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    // Kiểm tra xem có text hoặc image
    if (!createCommentDto.text && !createCommentDto.image) {
      throw new BadRequestException('Comment must have either text or image');
    }

    // Kiểm tra xem post có tồn tại không
    const post = await this.postModel.findById(createCommentDto.postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Tạo comment mới
    const newComment = new this.commentModel({
      post: createCommentDto.postId,
      user: userId,
      text: createCommentDto.text,
      image: createCommentDto.image,
      likeCount: 0,
    });
    const savedComment = await newComment.save();
    // Populate user information and ensure likeCount is set
    await savedComment.populate('user', '_id fullName username email avatar phoneNumber');

    // Transform to include isLiked for current user
    const commentWithLikeStatus = {
      ...savedComment.toObject(),
      isLiked: false, // New comment, user hasn't liked it yet
      likeCount: 0 // Explicitly set to 0 for new comments
    };

    // Lưu thông tin ảnh vào uploads collection nếu có image URL từ Cloudinary
    if (createCommentDto.image && createCommentDto.image.includes('cloudinary.com')) {
      try {
        await this.uploadsService.saveImangeInfo({
          url: createCommentDto.image,
          filename: `comment_${savedComment.id}.jpg`,
          originalname: `comment_image_${savedComment.id}.jpg`,
          mimetype: 'image/jpeg',
          size: 0, // Size sẽ được cập nhật từ Cloudinary metadata nếu cần
          metadata: {
            type: 'comment_image',
            commentId: savedComment.id,
            postId: createCommentDto.postId,
            uploadedAt: new Date(),
          }
        }, userId);
      } catch (error) {
        console.error('Error saving comment image info to uploads:', error);
        // Không throw error để không ảnh hưởng đến việc tạo comment
      }
    }

    // Cập nhật commentCount của post
    await this.postModel.findByIdAndUpdate(
      createCommentDto.postId,
      { $inc: { commentCount: 1 } }
    );

    // Gửi thông báo cho chủ bài viết (nếu không phải chính họ comment)
    const postAuthorId = post.user.toString();
    if (postAuthorId !== userId) {
      await this.notificationHelper.createPostCommentNotification(
        userId,
        postAuthorId,
        createCommentDto.postId,
        savedComment.id
      );
    }

    return commentWithLikeStatus;
  }  async getCommentsByPost(postId: string, userId?: string): Promise<Comment[]> {
    const comments = await this.commentModel
      .find({ post: postId })
      .populate('user', '_id fullName username email avatar phoneNumber')
      .sort({ createdAt: -1 })
      .exec();

    // Add isLiked status and ensure likeCount is correct for each comment
    if (userId) {
      const commentsWithLikeStatus = await Promise.all(
        comments.map(async (comment) => {
          const isLiked = await this.likesService.checkUserLikedComment(comment.id || comment._id, userId);
          const actualLikeCount = await this.likesService.getCommentLikeCount(comment.id || comment._id);
          
          // Update likeCount in database if it doesn't match
          if (comment.likeCount !== actualLikeCount) {
            await this.commentModel.findByIdAndUpdate(
              comment.id || comment._id,
              { likeCount: actualLikeCount }
            );
          }
          
          return {
            ...comment.toObject(),
            isLiked,
            likeCount: actualLikeCount
          };
        })
      );
      return commentsWithLikeStatus as Comment[];
    }

    // For non-authenticated users, still ensure likeCount is correct
    const commentsWithCorrectCount = await Promise.all(
      comments.map(async (comment) => {
        const actualLikeCount = await this.likesService.getCommentLikeCount(comment.id || comment._id);
        
        // Update likeCount in database if it doesn't match
        if (comment.likeCount !== actualLikeCount) {
          await this.commentModel.findByIdAndUpdate(
            comment.id || comment._id,
            { likeCount: actualLikeCount }
          );
        }
        
        return {
          ...comment.toObject(),
          likeCount: actualLikeCount
        };
      })
    );
    
    return commentsWithCorrectCount as Comment[];
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.toString() !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    // Giảm commentCount của post
    await this.postModel.findByIdAndUpdate(
      comment.post,
      { $inc: { commentCount: -1 } }
    );

    await comment.deleteOne();
  }
}
