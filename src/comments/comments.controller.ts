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
          email: 'user@domain.com',
          avatar: null
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
            email: 'user@domain.com',
            avatar: null
          },
          text: 'Great photo!',
          image: null,
          likeCount: 0,
          isLiked: false,
          createdAt: '2025-04-11T02:51:56+07:00'
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Missing postId parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getComments(@Query('postId') postId: string, @Req() req) {
    return this.commentsService.getCommentsByPost(postId, req.user?.userId);
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
    return { message: 'Xóa bình luận thành công' };
  }
}
