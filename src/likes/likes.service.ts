import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { CreateLikeDto } from './dto/create-like.dto';
import { NotificationHelperService } from '../notifications/notification-helper.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly notificationHelper: NotificationHelperService,
  ) {}
  // Like một post
  async likePost(createLikeDto: CreateLikeDto, userId: string): Promise<Like> {
    console.log('LikesService.likePost called with:', { createLikeDto, userId });
    const { postId } = createLikeDto;

    // Kiểm tra post có tồn tại và chưa bị xóa
    console.log('Checking if post exists:', postId);
    const post = await this.postModel.findOne({
      _id: postId,
      isDeleted: { $ne: true },
      expiresAt: { $gt: new Date() }
    });

    if (!post) {
      throw new NotFoundException('Post not found or has expired');
    }

    // Kiểm tra user đã like post này chưa
    const existingLike = await this.likeModel.findOne({
      post: postId,
      user: userId,
      likeType: 'post'
    });

    if (existingLike) {
      throw new ConflictException('User already liked this post');
    }    // Tạo like mới
    const likeData = {
      post: postId,
      user: userId,
      likeType: 'post',
      likedAt: new Date()
    };
    
    console.log('Creating like with data:', likeData);
    
    const newLike = new this.likeModel(likeData);
    console.log('New like model created:', newLike.toObject());

    const savedLike = await newLike.save();

    // Cập nhật likeCount trong post
    await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    // Gửi thông báo nếu không phải chính chủ post
    const postAuthorId = post.user.toString();
    if (postAuthorId !== userId) {
      await this.notificationHelper.createPostLikeNotification(
        userId,
        postAuthorId,
        postId
      );
    }

    return savedLike.populate(['user', 'post']);
  }

  // Unlike một post
  async unlikePost(postId: string, userId: string): Promise<void> {
    // Kiểm tra post có tồn tại
    const post = await this.postModel.findOne({
      _id: postId,
      isDeleted: { $ne: true }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Tìm và xóa like
    const deletedLike = await this.likeModel.findOneAndDelete({
      post: postId,
      user: userId,
      likeType: 'post'
    });

    if (!deletedLike) {
      throw new BadRequestException('User has not liked this post');
    }

    // Giảm likeCount trong post
    await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: -1 } },
      { new: true }
    );
  }

  // Like một comment
  async likeComment(commentId: string, userId: string): Promise<Like> {
    // Kiểm tra comment có tồn tại
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Kiểm tra user đã like comment này chưa
    const existingLike = await this.likeModel.findOne({
      comment: commentId,
      user: userId,
      likeType: 'comment'
    });

    if (existingLike) {
      throw new ConflictException('User already liked this comment');
    }

    // Tạo like mới
    const newLike = new this.likeModel({
      comment: commentId,
      user: userId,
      likeType: 'comment',
      likedAt: new Date()
    });

    const savedLike = await newLike.save();

    // Cập nhật likeCount trong comment
    await this.commentModel.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: 1 } },
      { new: true }
    );
    // Gửi thông báo nếu không phải chính chủ comment
    const commentAuthorId = comment.user.toString();
    const postId = comment.post.toString();
    if (commentAuthorId !== userId) {
      await this.notificationHelper.createCommentLikeNotification(
        userId, 
        commentAuthorId, 
        postId,
        commentId
      );
    }

    return savedLike.populate(['user', 'comment']);
  }

  // Unlike một comment
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    // Kiểm tra comment có tồn tại
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Tìm và xóa like
    const deletedLike = await this.likeModel.findOneAndDelete({
      comment: commentId,
      user: userId,
      likeType: 'comment'
    });

    if (!deletedLike) {
      throw new BadRequestException('User has not liked this comment');
    }

    // Giảm likeCount trong comment
    await this.commentModel.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: -1 } },
      { new: true }
    );
  }

  // Get comment like count
  async getCommentLikeCount(commentId: string): Promise<number> {
    return await this.likeModel.countDocuments({
      comment: commentId,
      likeType: 'comment'
    });
  }

  // Kiểm tra user đã like comment chưa
  async checkUserLikedComment(commentId: string, userId: string): Promise<boolean> {
    const like = await this.likeModel.findOne({
      comment: commentId,
      user: userId,
      likeType: 'comment'
    });
    
    return !!like;
  }

  // Lấy danh sách users đã like một comment
  async getCommentLikes(commentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const likes = await this.likeModel
      .find({ 
        comment: commentId, 
        likeType: 'comment' 
      })
      .populate('user', '_id fullName username avatar')
      .sort({ likedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.likeModel.countDocuments({ 
      comment: commentId, 
      likeType: 'comment' 
    });

    return {
      likes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  // Kiểm tra user đã like post chưa
  async checkUserLikedPost(postId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    
    const like = await this.likeModel.findOne({
      post: postId,
      user: userId,
      likeType: 'post'
    });

    return !!like;
  }
  // Lấy thống kê likes của user
  async getUserLikeStats(userId: string) {
    const totalLikes = await this.likeModel.countDocuments({ user: userId });
    
    return {
      totalLikes
    };
  }
  // Lấy danh sách posts user đã like
  async getUserLikedPosts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const likes = await this.likeModel
      .find({ 
        user: userId, 
        likeType: 'post' 
      })
      .populate({
        path: 'post',
        match: { isDeleted: { $ne: true } },
        populate: {
          path: 'user',
          select: 'username fullName avatar'
        }
      })
      .sort({ likedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Filter out likes where post is null (deleted posts)
    const validLikes = likes.filter(like => like.post);

    const total = await this.likeModel.countDocuments({ 
      user: userId,
      likeType: 'post',
      post: { $exists: true }
    });

    return {
      likes: validLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Lấy danh sách users đã like một post
  async getPostLikes(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const likes = await this.likeModel
      .find({ 
        post: postId, 
        likeType: 'post' 
      })
      .populate('user', '_id fullName username avatar')
      .sort({ likedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.likeModel.countDocuments({ 
      post: postId, 
      likeType: 'post' 
    });

    return {
      likes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
