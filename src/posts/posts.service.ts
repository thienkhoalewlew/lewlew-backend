import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationHelper: NotificationHelperService,
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
    });    const savedPost = await newPost.save();
    
    // Gửi thông báo cho bạn bè khi người dùng tạo bài viết mới
    await this.notifyFriendsAboutNewPost(user.userId, savedPost._id);
    
    return savedPost;
  }

  async findByUser(userId: string): Promise<Post[]> {
    return this.postModel.find({ user: userId, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findNearby(lat: number, lng: number, radius: number = 10): Promise<Post[]> {
    // Convert radius from km to radians (Earth radius is approximately 6371 km)
    const radiusInRadians = radius / 6371;
    
    return this.postModel.find({
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
    return this.postModel.find({
      user: { $in: user.friends },
      expiresAt: { $gt: new Date() }
    })
    .populate('user', '-password')
    .sort({ createdAt: -1 })
    .exec();
  }

  async like(postId: string, user: UserDocument): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Check if user already liked the post
    const alreadyLiked = post.likes && post.likes.some(userId => 
      userId.toString() === user._id?.toString());
    if (alreadyLiked) {
      throw new BadRequestException('User already liked this post');
    }
    
    // Add user to likes array and increment likeCount
    post.likes = [...(post.likes || []), user._id as any];
    post.likeCount = (post.likeCount || 0) + 1;

    const savedPost = await post.save();

    const postAuthorId = post.user.toString();
    const likerId = user.id.toString();

    if(postAuthorId !== likerId) {
      await this.notificationHelper.createPostLikeNotification(
        likerId,
        postAuthorId,
        postId
      );
    }
    return savedPost
  }

  async unlike(postId: string, user: UserDocument): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Check if user liked the post
    const likedIndex = post.likes ? post.likes.findIndex(userId => 
      userId.toString() === user._id?.toString()) : -1;
    if (likedIndex === -1) {
      throw new BadRequestException('User has not liked this post');
    }
    
    // Remove user from likes array and decrement likeCount
    post.likes.splice(likedIndex, 1);
    post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
    
    return post.save();
  }
  async deletePost(postId: string, userId: string): Promise<void> {
  const post = await this.postModel.findById(postId);
  if (!post) {
    throw new NotFoundException('Post not found');
  }

  if (post.user.toString() !== userId) {
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
}
