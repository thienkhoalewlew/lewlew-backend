import { Controller, Post, Get, Delete, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ 
    status: 201, 
    description: 'Comment created successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9c1',
        post: '6571a2d3e87cf87df032a9b2',
        user: {
          id: '6571a2d3e87cf87df032a9b1',
          fullName: 'John Smith',
          email: 'john.smith@example.com',
          avatar: 'https://example.com/avatar.jpg'
        },
        text: 'Great photo!',
        image: 'https://res.cloudinary.com/demo/image/upload/v1234567890/comment-image.jpg',
        likes: [],
        likeCount: 0,
        createdAt: '2025-04-11T02:51:56+07:00'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(@Body() createCommentDto: CreateCommentDto, @Req() req) {
    return this.commentsService.createComment(createCommentDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiQuery({ name: 'postId', description: 'Post ID', required: true, example: '6571a2d3e87cf87df032a9b2' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of comments',
    schema: {
      example: [
        {
          id: '6571a2d3e87cf87df032a9c1',
          post: '6571a2d3e87cf87df032a9b2',
          user: {
            id: '6571a2d3e87cf87df032a9b1',
            fullName: 'John Smith',
            email: 'john.smith@example.com',
            avatar: 'https://example.com/avatar.jpg'
          },
          text: 'Great photo!',
          image: null,
          likes: [],
          likeCount: 0,
          createdAt: '2025-04-11T02:51:56+07:00'
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Missing postId parameter' })
  async getComments(@Query('postId') postId: string) {
    return this.commentsService.getCommentsByPost(postId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(@Param('id') id: string, @Req() req) {
    await this.commentsService.deleteComment(id, req.user.userId);
    return { message: 'Comment deleted successfully' };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comment liked successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9c1',
        likes: ['6571a2d3e87cf87df032a9b1'],
        likeCount: 1
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Comment already liked' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async likeComment(@Param('id') id: string, @Req() req) {
    return this.commentsService.likeComment(id, req.user.userId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', example: '6571a2d3e87cf87df032a9c1' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comment unliked successfully',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9c1',
        likes: [],
        likeCount: 0
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Comment not liked yet' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async unlikeComment(@Param('id') id: string, @Req() req) {
    return this.commentsService.unlikeComment(id, req.user.userId);
  }
}
