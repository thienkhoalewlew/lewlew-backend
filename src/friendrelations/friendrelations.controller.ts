import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { FriendrelationsService } from './friendrelations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersDto } from './dto/search-users.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Friendrelations')
@Controller('friendrelations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendrelationsController {
  constructor(private readonly friendrelationsService: FriendrelationsService) {}

  /**
   * Search for users
   */
  @Get('search')
  @ApiOperation({ summary: 'Search for users by name or email' })
  @ApiQuery({ name: 'query', required: false, example: 'john', description: 'Name or email to search for' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number, starting from 1' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of results per page' })
  @ApiResponse({ status: 200, description: 'List of users', schema: { example: [{ _id: '6571a2d3e87cf87df032a9b1', fullName: 'John Smith', email: 'john.smith@example.com', avatar: 'https://example.com/avatar.jpg' }] } })
  async searchUsers(@Req() req, @Query() searchDto: SearchUsersDto) {
    return this.friendrelationsService.searchUsers(req.user.userId, searchDto);
  }

  /**
   * Send a friend request
   */
  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiBody({ type: SendFriendRequestDto, examples: { example1: { value: { receiverId: '6571a2d3e87cf87df032a9b2' } } } })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully', schema: { example: { message: 'Friend request sent successfully' } } })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async sendFriendRequest(@Req() req, @Body() sendRequestDto: SendFriendRequestDto) {
    return this.friendrelationsService.sendFriendRequest(
      req.user.userId,
      sendRequestDto.receiverId,
    );
  }

  /**
   * Respond to a friend request
   */
  @Put('request/:requestId')
  @ApiOperation({ summary: 'Respond to a friend request (accept/reject)' })
  @ApiParam({ name: 'requestId', required: true, example: '661f0b6f2e7c3c001f9c9a12', description: 'Friend request ID' })
  @ApiBody({ type: RespondFriendRequestDto, examples: { accept: { value: { response: 'accept' } }, reject: { value: { response: 'reject' } } } })
  @ApiResponse({ status: 200, description: 'Response successful', schema: { example: { message: 'Friend request accepted' } } })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  async respondToFriendRequest(
    @Req() req,
    @Param('requestId') requestId: string,
    @Body() respondDto: RespondFriendRequestDto,
  ) {
    return this.friendrelationsService.respondToFriendRequest(
      req.user.userId,
      requestId,
      respondDto.response,
    );
  }

  /**
   * Unfriend a user
   */
  @Delete('friend/:friendId')
  @ApiOperation({ summary: 'Unfriend a user' })
  @ApiParam({ name: 'friendId', required: true, example: '6571a2d3e87cf87df032a9b2', description: 'User ID to unfriend' })
  @ApiResponse({ status: 200, description: 'Unfriended successfully', schema: { example: { message: 'Unfriended successfully' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unfriend(@Req() req, @Param('friendId') friendId: string) {
    return this.friendrelationsService.unfriend(req.user.userId, friendId);
  }

  /**
   * Get the user's friends list
   */
  @Get('friends')
  @ApiOperation({ summary: "Get the current user's friends list" })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number, starting from 1' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of results per page' })
  @ApiResponse({ status: 200, description: 'List of friends', schema: { example: [{ _id: '6571a2d3e87cf87df032a9b2', fullName: 'Jane Doe', email: 'jane.doe@example.com', avatar: 'https://example.com/avatar2.jpg' }] } })
  async getFriends(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.friendrelationsService.getFriends(
      req.user.userId,
      page,
      limit,
    );
  }

  /**
   * Get received friend requests
   */
  @Get('requests')
  @ApiOperation({ summary: 'Get received friend requests' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number, starting from 1' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of results per page' })
  @ApiResponse({ status: 200, description: 'List of received friend requests', schema: { example: [{ _id: '661f0b6f2e7c3c001f9c9a12', sender: { _id: '6571a2d3e87cf87df032a9b2', fullName: 'Jane Doe' }, status: 'pending' }] } })
  async getFriendRequests(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.friendrelationsService.getFriendRequests(
      req.user.userId,
      page,
      limit,
    );
  }

  /**
   * Get sent friend requests
   */
  @Get('sent-requests')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number, starting from 1' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of results per page' })
  @ApiResponse({ status: 200, description: 'List of sent friend requests', schema: { example: [{ _id: '661f0b6f2e7c3c001f9c9a13', receiver: { _id: '6571a2d3e87cf87df032a9b3', fullName: 'Alice' }, status: 'pending' }] } })
  async getSentFriendRequests(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.friendrelationsService.getSentFriendRequests(
      req.user.userId,
      page,
      limit,
    );
  }

  /**
   * Cancel a sent friend request
   */
  @Delete('request/:requestId')
  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiParam({ name: 'requestId', required: true, example: '661f0b6f2e7c3c001f9c9a12', description: 'Sent friend request ID' })
  @ApiResponse({ status: 200, description: 'Friend request cancelled successfully', schema: { example: { message: 'Friend request cancelled successfully' } } })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  async cancelFriendRequest(
    @Req() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendrelationsService.cancelFriendRequest(
      req.user.userId,
      requestId,
    );
  }
}
