import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Upload, UploadDocument } from '../uploads/schemas/upload.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Report, ReportDocument } from '../reports/schemas/report.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { UploadsService } from '../uploads/uploads.service';
import { LikesService } from '../likes/likes.service';

@Injectable()
export class PostsService {  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Upload.name) private uploadModel: Model<UploadDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly notificationHelper: NotificationHelperService,
    private readonly uploadsService: UploadsService,
    private readonly likesService: LikesService,
  ) {}
  async create(createPostDto: CreatePostDto, user: any): Promise<Post> {
    const expiresAt = createPostDto.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
    
    const newPost = new this.postModel({
      imageUrl: createPostDto.image,
      caption: createPostDto.caption,
      location: createPostDto.location,
      user: user.userId,
      expiresAt,
      createdAt: new Date(),
      likeCount: 0,
      commentCount: 0,
    });    

    const savedPost = await newPost.save();
    
    // Lưu thông tin ảnh vào uploads collection nếu có image URL từ Cloudinary
    if (createPostDto.image && createPostDto.image.includes('cloudinary.com')) {
      try {
        await this.uploadsService.saveImangeInfo({
          url: createPostDto.image,
          filename: `post_${savedPost.id}.jpg`,
          originalname: `post_image_${savedPost.id}.jpg`,
          mimetype: 'image/jpeg',
          size: 0, // Size sẽ được cập nhật từ Cloudinary metadata nếu cần
          metadata: {
            type: 'post_image',
            postId: savedPost.id,
            uploadedAt: new Date(),
          }
        }, user.userId);
      } catch (error) {
        console.error('Error saving post image info to uploads:', error);
        // Không throw error để không ảnh hưởng đến việc tạo post
      }
    }
    
    // Gửi thông báo cho bạn bè khi người dùng tạo bài viết mới
    await this.notifyFriendsAboutNewPost(user.userId, savedPost.id);
    
    return savedPost;
  }
  async findByUser(userId: string, includeExpired: boolean = false, includeDeleted: boolean = false, currentUserId?: string): Promise<Post[]> {
    console.log('Finding posts for user:', userId, 'includeExpired:', includeExpired, 'includeDeleted:', includeDeleted);
    
    // Base query to find posts by user
    const query: any = { user: userId };
    
    // Filter out soft-deleted posts unless specifically requested
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    
    // Only add expiration filter if we don't want to include expired posts
    if (!includeExpired) {
      query.expiresAt = { $gt: new Date() };
    }

    console.log('Query:', JSON.stringify(query));

    const posts = await this.postModel.find(query)
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .exec();

    console.log('Found posts count:', posts.length);

    // Enhance posts with upload information
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          // Find corresponding upload info for this post's image
          const uploadInfo = await this.uploadModel.findOne({
            'metadata.postId': post.id,
            'metadata.type': 'post_image'
          }).exec();

          // Add upload metadata to post if available
          if (uploadInfo) {
            return {
              ...post.toObject(),
              uploadInfo: {
                id: uploadInfo.id,
                filename: uploadInfo.filename,
                originalname: uploadInfo.originalname,
                mimetype: uploadInfo.mimetype,
                size: uploadInfo.size,
                uploadedAt: uploadInfo.metadata?.uploadedAt,
                status: uploadInfo.status
              }
            };
          }
          
          return post.toObject();
        } catch (error) {
          console.error('Error fetching upload info for post:', post.id, error);
          return post.toObject();
        }
      })    );    // Add like status to posts for findByUser
    const postsWithLikeStatus = await this.addLikeStatusToPosts(enhancedPosts, currentUserId);

    return postsWithLikeStatus as Post[];
  }
  async findNearby(lat: number, lng: number, radius: number = 10, userId?: string): Promise<Post[]> {
    // Convert radius from km to radians (Earth radius is approximately 6371 km)
    const radiusInRadians = radius / 6371;
    
    // Find posts within the radius that haven't expired and are not soft-deleted
    const posts = await this.postModel.find({
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      },
      expiresAt: { $gt: new Date() },
      isDeleted: { $ne: true }
    })
    .populate('user', '-password')
    .sort({ createdAt: -1 })
    .exec();

    // Enhance posts with upload information
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {        try {
          // Find corresponding upload info for this post's image
          const uploadInfo = await this.uploadModel.findOne({
            'metadata.postId': post.id,
            'metadata.type': 'post_image'
          }).exec();

          // Add upload metadata to post if available
          if (uploadInfo) {
            return {
              ...post.toObject(),
              uploadInfo: {
                id: uploadInfo.id,
                filename: uploadInfo.filename,
                originalname: uploadInfo.originalname,
                mimetype: uploadInfo.mimetype,
                size: uploadInfo.size,
                uploadedAt: uploadInfo.metadata?.uploadedAt,
                status: uploadInfo.status
              }
            };
          }
          
          return post.toObject();
        } catch (error) {
          console.error('Error fetching upload info for post:', post.id, error);
          return post.toObject();
        }
      })    );

    // Add like status to posts for findNearby
    const postsWithLikeStatus = await this.addLikeStatusToPosts(enhancedPosts, userId);

    return postsWithLikeStatus as Post[];
  }
  async findByFriends(userId: string): Promise<Post[]> {
    // Tìm người dùng qua ID
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Kiểm tra nếu không có bạn bè
    if (!user.friends || user.friends.length === 0) {
      return [];
    }
      // Lấy tất cả bài viết từ danh sách bạn bè (chưa hết hạn và chưa bị xóa)
    const posts = await this.postModel.find({
      user: { $in: user.friends },
      expiresAt: { $gt: new Date() },
      isDeleted: { $ne: true }
    })
    .populate('user', '-password')
    .sort({ createdAt: -1 })
    .exec();

    // Enhance posts with upload information
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          // Find corresponding upload info for this post's image
          const uploadInfo = await this.uploadModel.findOne({
            'metadata.postId': post.id,
            'metadata.type': 'post_image'
          }).exec();

          // Add upload metadata to post if available
          if (uploadInfo) {
            return {
              ...post.toObject(),
              uploadInfo: {
                id: uploadInfo.id,
                filename: uploadInfo.filename,
                originalname: uploadInfo.originalname,
                mimetype: uploadInfo.mimetype,
                size: uploadInfo.size,
                uploadedAt: uploadInfo.metadata?.uploadedAt,
                status: uploadInfo.status
              }
            };
          }
          
          return post.toObject();
        } catch (error) {
          console.error('Error fetching upload info for post:', post.id, error);
          return post.toObject();
        }
      })    );

    // Add like status to posts for findByFriends
    const postsWithLikeStatus = await this.addLikeStatusToPosts(enhancedPosts, userId);

    return postsWithLikeStatus as Post[];
  }  // Delegate like functionality to LikesService
  async like(postId: string, user: any): Promise<any> {
    const userId = user.userId || user._id || user.id;
    return this.likesService.likePost({ postId }, userId);
  }

  // Delegate unlike functionality to LikesService
  async unlike(postId: string, user: any): Promise<void> {
    const userId = user.userId || user._id || user.id;
    return this.likesService.unlikePost(postId, userId);
  }
  async deletePost(postId: string, userId: string, reason: string = 'Deleted by user'): Promise<void> {
    const post = await this.postModel.findOne({ 
      _id: postId, 
      isDeleted: { $ne: true } 
    });
    if (!post) {
      throw new NotFoundException('Post not found or already deleted');
    }

    if (post.user.toString() !== userId.toString()) {
      throw new BadRequestException('You are not authorized to delete this post');
    }    // Soft delete: mark as deleted instead of removing from database
    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = userId;
    post.deletionReason = reason;
    
    await post.save();
    
    console.log(`🗑️ Post ${postId} soft deleted by user ${userId}. Reason: ${reason}`);
  }
  /**
   * Admin method to permanently delete a post (hard delete)
   * Only use this when absolutely necessary
   */
  async hardDeletePost(postId: string, adminUserId: string): Promise<void> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    console.log(`🔥 Starting permanent deletion of post ${postId} by admin ${adminUserId}`);

    try {
      // 1. Delete all comments related to this post
      const deletedComments = await this.commentModel.deleteMany({ post: postId });
      console.log(`🔥 Deleted ${deletedComments.deletedCount} comments for post ${postId}`);

      // 2. Delete all reports related to this post
      const deletedReports = await this.reportModel.deleteMany({ postId: postId });
      console.log(`🔥 Deleted ${deletedReports.deletedCount} reports for post ${postId}`);

      // 3. Delete upload records related to this post
      const deletedUploads = await this.uploadModel.deleteMany({ 
        'metadata.postId': postId,
        'metadata.type': 'post_image'
      });
      console.log(`🔥 Deleted ${deletedUploads.deletedCount} upload records for post ${postId}`);

      // 4. Finally, delete the post itself
      await post.deleteOne();
      console.log(`🔥 Post ${postId} and all related data permanently deleted by admin ${adminUserId}`);
      
    } catch (error) {
      console.error(`🔥 Error during permanent deletion of post ${postId}:`, error);
      throw error;
    }
  }
  /**
   * Soft delete a post due to report violation
   * Used by the reporting system
   */
  async softDeletePostByReport(postId: string, reason: string, moderatorId?: string): Promise<void> {
    const post = await this.postModel.findOne({ 
      _id: postId, 
      isDeleted: { $ne: true } 
    });
    if (!post) {
      throw new NotFoundException('Post not found or already deleted');
    }
    // Soft delete: mark as deleted
    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = moderatorId || post.user; // Use moderator ID if available, otherwise post owner
    post.deletionReason = reason;
    
    await post.save();
    
    console.log(`🚨 Post ${postId} soft deleted due to report. Reason: ${reason}. Moderator: ${moderatorId || 'system'}`);
  }
    /**
   * Gửi thông báo cho tất cả bạn bè khi người dùng tạo một bài viết mới
   */
  private async notifyFriendsAboutNewPost(userId: string, postId: any): Promise<void> {
    try {
      // Đảm bảo postId là string
      const postIdString = typeof postId === 'object' && postId !== null ? 
        postId.toString() : String(postId);
      
      // Tìm người dùng và lấy danh sách bạn bè
      const user = await this.userModel.findById(userId);
      if (!user || !user.friends || user.friends.length === 0) {
        return; // Không có bạn bè để thông báo
      }
      
      // Gửi thông báo đến từng người bạn
      const promises = user.friends.map(friendId => 
        this.notificationHelper.createFriendPostNotification(
          userId, // senderId (người đăng bài)
          friendId.toString(), // recipientId (người bạn nhận thông báo)
          postIdString // ID của bài viết mới
        )
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending notifications to friends:', error);
      // Không ném lỗi ra ngoài để không ảnh hưởng đến việc tạo bài viết
    }
  }
  async findById(postId: string): Promise<Post> {
    const post = await this.postModel.findOne({ 
      _id: postId, 
      isDeleted: { $ne: true } 
    })
      .populate('user', '-password')
      .exec();
    
    if (!post) {
      throw new NotFoundException('Post not found or has been deleted');
    }

    // Kiểm tra bài viết đã hết hạn chưa (quá 24h)
    const now = new Date();
    const postCreatedAt = new Date(post.createdAt);
    const timeDifference = now.getTime() - postCreatedAt.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    
    if (hoursDifference >= 24) {
      throw new NotFoundException('Post has expired (older than 24 hours)');
    }

    // Enhance post with upload information
    try {
      // Find corresponding upload info for this post's image
      const uploadInfo = await this.uploadModel.findOne({
        'metadata.postId': post.id,
        'metadata.type': 'post_image'
      }).exec();

      // Add upload metadata to post if available
      if (uploadInfo) {
        return {
          ...post.toObject(),
          uploadInfo: {
            id: uploadInfo.id,
            filename: uploadInfo.filename,
            originalname: uploadInfo.originalname,
            mimetype: uploadInfo.mimetype,
            size: uploadInfo.size,
            uploadedAt: uploadInfo.metadata?.uploadedAt,
            status: uploadInfo.status
          }
        } as Post;
      }
      
      return post.toObject() as Post;
    } catch (error) {
      console.error('Error fetching upload info for post:', post.id, error);
      return post.toObject() as Post;
    }
  }
  // Helper method to add like status to posts
  private async addLikeStatusToPosts(posts: any[], userId?: string): Promise<any[]> {
    if (!userId) {
      return posts.map(post => ({
        ...post,
        isLiked: false,
        // Ensure commentCount is included (fallback to 0 if not present)
        commentCount: post.commentCount || 0
      }));
    }

    return Promise.all(posts.map(async (post) => {
      const isLiked = await this.likesService.checkUserLikedPost(post._id || post.id, userId);
      return {
        ...post,
        isLiked,
        // Ensure commentCount is included (fallback to 0 if not present)
        commentCount: post.commentCount || 0
      };
    }));
  }
  /**
   * Recalculate comment count for all posts
   * This method should be called to sync existing data
   */
  async recalculateCommentCounts(): Promise<void> {
    console.log('🔄 Starting comment count recalculation for all posts...');
    
    try {
      const posts = await this.postModel.find({ isDeleted: { $ne: true } }).exec();
      
      for (const post of posts) {
        const actualCommentCount = await this.commentModel.countDocuments({ post: post._id }).exec();
        
        if (post.commentCount !== actualCommentCount) {
          console.log(`📊 Updating comment count for post ${post._id}: ${post.commentCount} -> ${actualCommentCount}`);
          await this.postModel.findByIdAndUpdate(post._id, { commentCount: actualCommentCount });
        }
      }
      
      console.log('✅ Comment count recalculation completed');
    } catch (error) {
      console.error('❌ Error during comment count recalculation:', error);
      throw error;
    }
  }
}
