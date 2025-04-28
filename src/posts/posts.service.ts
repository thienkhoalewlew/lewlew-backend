import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createPostDto: CreatePostDto, user: UserDocument): Promise<Post> {
    const expiresAt = createPostDto.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
    
    const newPost = new this.postModel({
      ...createPostDto,
      user: user._id as any,
      expiresAt,
      createdAt: new Date(),
      likeCount: 0,
      commentCount: 0,
    });
    
    return newPost.save();
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
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
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
    
    return post.save();
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
}
