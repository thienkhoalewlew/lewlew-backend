import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}  @Post()
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ 
    status: 201, 
    description: 'Post liked successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9c1',
        post: '6571a2d3e87cf87df032a9b2',
        user: '6571a2d3e87cf87df032a9b1',
        likeType: 'post',
        likedAt: '2025-04-11T02:51:56+07:00'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data or user already liked this post' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async likePost(@Body() createLikeDto: CreateLikeDto, @Request() req) {
    console.log('LikesController.likePost called with:', { createLikeDto, userId: req.user.userId });
    return this.likesService.likePost(createLikeDto, req.user.userId);
  }
  @Delete(':postId')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', example: '6571a2d3e87cf87df032a9b2' })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  @ApiResponse({ status: 400, description: 'User has not liked this post' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async unlikePost(@Param('postId') postId: string, @Request() req) {
    return this.likesService.unlikePost(postId, req.user.userId);
  }  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all likes for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', example: '6571a2d3e87cf87df032a9b2' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Number of likes per page', required: false, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'List of likes for the post',
    schema: {
      example: {
        likes: [
          {
            id: '6571a2d3e87cf87df032a9c1',
            user: {
              id: '6571a2d3e87cf87df032a9b1',
              fullName: 'John Smith',
              avatar: 'https://example.com/avatar.jpg'
            },
            likedAt: '2025-04-11T02:51:56+07:00'
          }
        ],
        total: 15,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostLikes(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getPostLikes(postId, page, limit);
  }
  @Get('check/:postId')
  @ApiOperation({ summary: 'Check if current user liked a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', example: '6571a2d3e87cf87df032a9b2' })
  @ApiResponse({ 
    status: 200, 
    description: 'Like status for the post',
    schema: {
      example: {
        liked: true
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async checkUserLikedPost(@Param('postId') postId: string, @Request() req) {
    const liked = await this.likesService.checkUserLikedPost(postId, req.user.userId);
    return { liked };  }

  @Post('comment/:commentId')
  @ApiOperation({ summary: 'Like a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiResponse({ 
    status: 201, 
    description: 'Comment liked successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9c2',
        comment: '6571a2d3e87cf87df032a9c1',
        user: '6571a2d3e87cf87df032a9b1',
        likeType: 'comment',
        likedAt: '2025-04-11T02:51:56+07:00'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data or user already liked this comment' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async likeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.likesService.likeComment(commentId, req.user.userId);
  }
  @Delete('comment/:commentId')
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiResponse({ status: 200, description: 'Comment unliked successfully' })
  @ApiResponse({ status: 400, description: 'User has not liked this comment' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async unlikeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.likesService.unlikeComment(commentId, req.user.userId);
  }
  @Get('comment/:commentId')
  @ApiOperation({ summary: 'Get all likes for a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Number of likes per page', required: false, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'List of likes for the comment',
    schema: {
      example: {
        likes: [
          {
            id: '6571a2d3e87cf87df032a9c2',
            user: {
              id: '6571a2d3e87cf87df032a9b1',
              fullName: 'John Smith',
              avatar: 'https://example.com/avatar.jpg'
            },
            likedAt: '2025-04-11T02:51:56+07:00'
          }
        ],
        total: 5,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentLikes(
    @Param('commentId') commentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getCommentLikes(commentId, page, limit);
  }
  @Get('check/comment/:commentId')
  @ApiOperation({ summary: 'Check if current user liked a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiResponse({ 
    status: 200, 
    description: 'Like status for the comment',
    schema: {
      example: {
        liked: false
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async checkUserLikedComment(@Param('commentId') commentId: string, @Request() req) {
    const liked = await this.likesService.checkUserLikedComment(commentId, req.user.userId);
    return { liked };
  }
}
