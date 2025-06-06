import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly notificationHelper: NotificationHelperService,
    private readonly uploadsService: UploadsService,
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

    return savedComment;
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ post: postId })
      .populate('user', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .exec();
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

  async likeComment(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Kiểm tra xem user đã like comment chưa
    const alreadyLiked = comment.likes && comment.likes.some(id => 
      id.toString() === userId
    );

    if (alreadyLiked) {
      throw new BadRequestException('Comment already liked');
    }

    // Thêm user vào danh sách likes
    comment.likes = [...(comment.likes || []), userId as any];
    comment.likeCount = (comment.likeCount || 0) + 1;

    return comment.save();
  }

  async unlikeComment(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Kiểm tra xem user đã like comment chưa
    const likedIndex = comment.likes ? comment.likes.findIndex(id => 
      id.toString() === userId
    ) : -1;

    if (likedIndex === -1) {
      throw new BadRequestException('Comment not liked yet');
    }

    // Xóa user khỏi danh sách likes
    comment.likes.splice(likedIndex, 1);
    comment.likeCount = Math.max(0, (comment.likeCount || 1) - 1);

    return comment.save();
  }
}
