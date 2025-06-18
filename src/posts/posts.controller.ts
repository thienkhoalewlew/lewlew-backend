import { Controller } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ 
    status: 201, 
    description: 'Post created successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b2',
        user: '6571a2d3e87cf87df032a9b1',
        image: null,
        caption: 'Beautiful day in New York!',
        location: {
          type: 'Point',
          coordinates: [-73.9857, 40.7484],
          placeName: 'New York, USA'
        },
        likes: [],
        likeCount: 0,
        commentCount: 0,
        expiresAt: '2025-04-12T02:51:56+07:00',
        createdAt: '2025-04-11T02:51:56+07:00'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  createPost(@Body() createPostDto: CreatePostDto, @Req() req) {
    return this.postsService.create(createPostDto, req.user);
  }  @UseGuards(JwtAuthGuard)
  @Get('my-posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts of the current logged-in user' })
  @ApiQuery({ 
    name: 'includeExpired', 
    required: false, 
    type: Boolean,
    description: 'Whether to include expired posts in the response'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user posts',
    schema: {
      example: [
        {
          id: '6571a2d3e87cf87df032a9b2',
          user: {
            id: '6571a2d3e87cf87df032a9b1',
            fullName: 'John Smith',
            username: 'johnsmith',
            avatar: null
          },
          imageUrl: null,
          caption: 'Beautiful day in New York!',
          location: {
            type: 'Point',
            coordinates: [-73.9857, 40.7484],
            placeName: 'New York, USA'
          },
          likes: ['6571a2d3e87cf87df032a9b3'],
          likeCount: 1,
          commentCount: 2,
          expiresAt: '2025-04-12T02:51:56+07:00',
          createdAt: '2025-04-11T02:51:56+07:00',
          isDeleted: false
        },
        {
          id: '6571a2d3e87cf87df032a9b4',
          user: {
            id: '6571a2d3e87cf87df032a9b1',
            fullName: 'John Smith',
            username: 'johnsmith',
            avatar: null
          },
          imageUrl: null,
          caption: 'Lunch time!',
          location: {
            type: 'Point',
            coordinates: [-73.9902, 40.7435],
            placeName: 'Central Park, New York'
          },
          likes: [],
          likeCount: 0,
          commentCount: 0,
          expiresAt: '2025-04-13T02:51:56+07:00',
          createdAt: '2025-04-12T02:51:56+07:00',
          isDeleted: false
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })  async getMyPosts(@Req() req, @Query('includeExpired') includeExpired: string) {
    // Convert string query param to boolean
    const shouldIncludeExpired = includeExpired === 'true';
    console.log('Getting posts with includeExpired:', shouldIncludeExpired);
    return this.postsService.findByUser(req.user.userId, shouldIncludeExpired, false, req.user.userId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('friends-posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts from friends of the current logged-in user' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of posts from friends',
    schema: {
      example: [
        {
          id: '6571a2d3e87cf87df032a9b3',
          user: {
            id: '6571a2d3e87cf87df032a9b4',
            fullName: 'Jane Doe',
            email: 'user@domain.com',
            avatar: null
          },
          imageUrl: null,
          caption: 'Dinner with friends!',
          location: {
            type: 'Point',
            coordinates: [-73.9902, 40.7435],
            placeName: 'ABC Restaurant, New York'
          },
          likes: ['6571a2d3e87cf87df032a9b1'],
          likeCount: 1,
          commentCount: 2,
          expiresAt: '2025-04-12T02:51:56+07:00',
          createdAt: '2025-04-11T02:51:56+07:00'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getFriendsPostsOfCurrentUser(@Req() req) {
    return this.postsService.findByFriends(req.user.userId);
  }
  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts near current location' })
  @ApiQuery({ name: 'lat', description: 'Latitude', type: Number, example: 40.7484 })
  @ApiQuery({ name: 'lng', description: 'Longitude', type: Number, example: -73.9857 })
  @ApiQuery({ name: 'radius', description: 'Search radius in kilometers', type: Number, example: 10, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'List of posts',
    schema: {
      example: [
        {
          id: '6571a2d3e87cf87df032a9b2',
          user: {
            id: '6571a2d3e87cf87df032a9b1',
            fullName: 'John Smith',
            email: 'user@domain.com',
            avatar: null
          },
          imageUrl: null,
          caption: 'Beautiful day in New York!',
          location: {
            type: 'Point',
            coordinates: [-73.9857, 40.7484],
            placeName: 'New York, USA'
          },
          likeCount: 0,
          isLiked: false,
          commentCount: 0,
          expiresAt: '2025-04-12T02:51:56+07:00',
          createdAt: '2025-04-11T02:51:56+07:00'
        }
      ]
    }
  })
  getNearbyPosts(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 10,
    @Req() req
  ) {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    return this.postsService.findNearby(lat, lng, radius, userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts of a specific user by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String, example: '6571a2d3e87cf87df032a9b1' })
  @ApiQuery({ 
    name: 'includeExpired',
    description: 'Whether to include expired posts',
    type: Boolean,
    required: false,
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user posts',
    schema: {
      example: [
        {
          id: '6571a2d3e87cf87df032a9b2',
          user: {
            id: '6571a2d3e87cf87df032a9b1',
            fullName: 'John Smith',
            username: 'johnsmith',
            avatar: null
          },
          imageUrl: null,
          caption: 'Beautiful day in New York!',
          location: {
            type: 'Point',
            coordinates: [-73.9857, 40.7484],
            placeName: 'New York, USA'
          },
          likes: [],
          likeCount: 0,
          commentCount: 0,
          expiresAt: '2025-04-12T02:51:56+07:00',
          createdAt: '2025-04-11T02:51:56+07:00'
        }
      ]
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })  @UseGuards(JwtAuthGuard)
  getUserPosts(
    @Param('userId') userId: string,
    @Query('includeExpired') includeExpired: string = 'false',
    @Req() req
  ) {
    const shouldIncludeExpired = includeExpired === 'true';
    return this.postsService.findByUser(userId, shouldIncludeExpired, false, req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String, example: '6571a2d3e87cf87df032a9b2' })
  @ApiResponse({ 
    status: 200, 
    description: 'Post details',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b2',
        user: {
          id: '6571a2d3e87cf87df032a9b1',
          fullName: 'John Smith',
          username: 'johnsmith',
          avatar: null,
          bio: 'Travel enthusiast and photographer'
        },
        imageUrl: null,
        caption: 'Beautiful day in New York! The weather is perfect for exploring the city.',
        location: {
          type: 'Point',
          coordinates: [-73.9857, 40.7484],
          placeName: 'Times Square, New York, USA'
        },
        likes: ['6571a2d3e87cf87df032a9b3', '6571a2d3e87cf87df032a9b4'],
        likeCount: 2,
        commentCount: 5,
        expiresAt: '2025-04-12T02:51:56+07:00',
        createdAt: '2025-04-11T02:51:56+07:00',
        isDeleted: false,
        uploadInfo: {
          id: 'upload_123',
          filename: 'post123.jpg',
          originalname: 'my_photo.jpg',
          mimetype: 'image/jpeg',
          size: 1024000,
          uploadedAt: '2025-04-11T02:51:56+07:00',
          status: 'completed'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found or has expired' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getPostById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String, example: '6571a2d3e87cf87df032a9b2' })
  @ApiResponse({ 
    status: 200, 
    description: 'Post liked successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b2',
        likes: ['6571a2d3e87cf87df032a9b1'],
        likeCount: 1
      }
    }
  })
  @ApiResponse({ status: 400, description: 'User already liked this post' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  likePost(@Param('id') id: string, @Req() req) {
    return this.postsService.like(id, req.user);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String, example: '6571a2d3e87cf87df032a9b2' })
  @ApiResponse({ 
    status: 200, 
    description: 'Post unliked successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b2',
        likes: [],
        likeCount: 0
      }
    }
  })
  @ApiResponse({ status: 400, description: 'User has not liked this post' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  unlikePost(@Param('id') id: string, @Req() req) {
    return this.postsService.unlike(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Param('id') id: string, @Req() req) {
    await this.postsService.deletePost(id, req.user.userId);
    return { message: 'Xóa bài viết thành công' };
  }

  @Post('recalculate-comment-counts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate comment counts for all posts (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comment counts recalculated successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async recalculateCommentCounts(@Req() req) {
    // In a real app, you'd check if user is admin here
    await this.postsService.recalculateCommentCounts();
    return { message: 'Tính toán lại số lượng bình luận thành công' };
  }
}
