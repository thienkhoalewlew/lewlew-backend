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
        image: 'https://example.com/images/post123.jpg',
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
  }
  @UseGuards(JwtAuthGuard)
  @Get('my-posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts of the current logged-in user' })
  @ApiQuery({ 
    name: 'includeExpired', 
    required: false, 
    type: Boolean,
    description: 'Whether to include expired posts in the response'
  })
  @ApiResponse({ status: 200, description: 'List of user posts' })
  async getMyPosts(@Req() req, @Query('includeExpired') includeExpired: string) {
    // Convert string query param to boolean
    const shouldIncludeExpired = includeExpired === 'true';
    console.log('Getting posts with includeExpired:', shouldIncludeExpired);
    return this.postsService.findByUser(req.user.userId, shouldIncludeExpired);
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
            email: 'jane.doe@example.com',
            avatar: 'https://example.com/avatar2.jpg'
          },
          imageUrl: 'https://example.com/images/post456.jpg',
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
            email: 'john.smith@example.com',
            avatar: 'https://example.com/avatar.jpg'
          },
          image: 'https://example.com/images/post123.jpg',
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
  getNearbyPosts(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.postsService.findNearby(lat, lng, radius);
  }

  @Get('friends/:userId')
  @ApiOperation({ summary: 'Get posts from friends' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String, example: '6571a2d3e87cf87df032a9b1' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of friends\'s posts',
    schema: {
      example: [
        {
          id: '6571a2d3e87cf87df032a9b3',
          user: {
            id: '6571a2d3e87cf87df032a9b4',
            fullName: 'Jane Doe',
            email: 'jane.doe@example.com',
            avatar: 'https://example.com/avatar2.jpg'
          },
          image: 'https://example.com/images/post456.jpg',
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
  @ApiResponse({ status: 404, description: 'User not found' })
  getFriendPosts(@Param('userId') userId: string) {
    return this.postsService.findByFriends(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Post details' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
    return { message: 'Post deleted successfully' };
  }
}
