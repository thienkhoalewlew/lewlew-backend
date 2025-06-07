import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Upload, UploadDocument } from '../uploads/schemas/upload.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class PostsService {  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Upload.name) private uploadModel: Model<UploadDocument>,
    private readonly notificationHelper: NotificationHelperService,
    private readonly uploadsService: UploadsService,
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

  async findByUser(userId: string, includeExpired: boolean = false): Promise<Post[]> {
    console.log('Finding posts for user:', userId, 'includeExpired:', includeExpired);
    
    // Base query to find posts by user
    const query: any = { user: userId };
    
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
      })
    );

    return enhancedPosts as Post[];
  }

  async findNearby(lat: number, lng: number, radius: number = 10): Promise<Post[]> {
    // Convert radius from km to radians (Earth radius is approximately 6371 km)
    const radiusInRadians = radius / 6371;
    
    // Find posts within the radius that haven't expired
    const posts = await this.postModel.find({
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      },
      expiresAt: { $gt: new Date() }
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
      })
    );

    return enhancedPosts as Post[];
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
    
    // Lấy tất cả bài viết từ danh sách bạn bè (chưa hết hạn)
    const posts = await this.postModel.find({
      user: { $in: user.friends },
      expiresAt: { $gt: new Date() }
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
      })
    );

    return enhancedPosts as Post[];
  }
  async like(postId: string, user: any): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Get userId from JWT payload (user.userId from JWT strategy)
    const userId = user.userId || user._id || user.id;
    if (!userId) {
      throw new BadRequestException('Invalid user identification');
    }
      // Check if user already liked the post
    const alreadyLiked = post.likes && post.likes.some(likeUserId => 
      likeUserId && likeUserId.toString() === userId.toString());
    if (alreadyLiked) {
      throw new BadRequestException('User already liked this post');
    }
    
    // Add user to likes array and increment likeCount
    post.likes = [...(post.likes || []), userId];
    post.likeCount = (post.likeCount || 0) + 1;

    const savedPost = await post.save();

    const postAuthorId = post.user.toString();
    const likerId = userId.toString();

    if(postAuthorId !== likerId) {
      await this.notificationHelper.createPostLikeNotification(
        likerId,
        postAuthorId,
        postId
      );
    }
    return savedPost
  }
  async unlike(postId: string, user: any): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Get userId from JWT payload (user.userId from JWT strategy)
    const userId = user.userId || user._id || user.id;
    if (!userId) {
      throw new BadRequestException('Invalid user identification');
    }
      // Check if user liked the post
    const likedIndex = post.likes ? post.likes.findIndex(likeUserId => 
      likeUserId && likeUserId.toString() === userId.toString()) : -1;
    if (likedIndex === -1) {
      throw new BadRequestException('User has not liked this post');
    }
    
    // Remove user from likes array and decrement likeCount
    post.likes.splice(likedIndex, 1);
    post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
    
    return post.save();
  }  async deletePost(postId: string, userId: string): Promise<void> {
  const post = await this.postModel.findById(postId);
  if (!post) {
    throw new NotFoundException('Post not found');
  }

  if (post.user.toString() !== userId.toString()) {
    throw new BadRequestException('You are not authorized to delete this post');
  }

  await post.deleteOne();
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
    const post = await this.postModel.findById(postId)
      .populate('user', '-password')
      .exec();
    
    if (!post) {
      throw new NotFoundException('Post not found');
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
}
