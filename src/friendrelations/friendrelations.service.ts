import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FriendRelation, FriendRelationDocument } from './schemas/friendrelation.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SearchUsersDto } from './dto/search-users.dto';
import { FriendRequestResponse } from './dto/respond-friend-request.dto';
import { NotificationHelperService } from '../notifications/notification-helper.service';

@Injectable()
export class FriendrelationsService {
  constructor(
    @InjectModel(FriendRelation.name) private friendRelationModel: Model<FriendRelationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  /**
   * Tìm kiếm người dùng theo tên hoặc email
   */
  async searchUsers(userId: string, searchDto: SearchUsersDto) {
    const { query = '', page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    // Tạo điều kiện tìm kiếm
    const searchCondition = query
      ? {
          $or: [
            { fullName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
          _id: { $ne: userId }, // Loại trừ người dùng hiện tại
        }
      : { _id: { $ne: userId } };

    // Đếm tổng số kết quả
    const total = await this.userModel.countDocuments(searchCondition);

    // Lấy danh sách người dùng
    const users = await this.userModel
      .find(searchCondition)
      .select('_id fullName email avatar')
      .skip(skip)
      .limit(limit)
      .exec();

    // Lấy danh sách ID bạn bè của người dùng hiện tại
    const currentUser = await this.userModel
      .findById(userId)
      .select('friends friendRequests')
      .populate('friends', '_id')
      .populate('friendRequests.from', '_id')
      .exec();

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const friendIds = currentUser.friends.map(friend => (friend as any)._id.toString());
    const pendingRequestIds = currentUser.friendRequests.map(req => (req.from as any)._id.toString());

    // Lấy các lời mời kết bạn đã gửi
    const sentRequests = await this.friendRelationModel
      .find({
        requester: userId,
        status: 'pending',
      })
      .select('user2')
      .exec();

    const sentRequestIds = sentRequests.map(req => req.user2.toString());

    // Thêm trạng thái bạn bè vào kết quả
    const usersWithFriendStatus = users.map(user => {
      const userId = (user as any)._id.toString();
      let friendStatus = 'none';

      if (friendIds.includes(userId)) {
        friendStatus = 'friend';
      } else if (pendingRequestIds.includes(userId)) {
        friendStatus = 'pending_received';
      } else if (sentRequestIds.includes(userId)) {
        friendStatus = 'pending_sent';
      }

      return {
        ...user.toJSON(),
        friendStatus,
      };
    });

    return {
      users: usersWithFriendStatus,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Gửi lời mời kết bạn
   */
  async sendFriendRequest(senderId: string, receiverId: string) {
    // Kiểm tra người nhận có tồn tại không
    const receiver = await this.userModel.findById(receiverId).exec();
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Kiểm tra xem đã là bạn bè chưa
    const existingFriend = await this.userModel.findOne({
      _id: senderId,
      friends: { $in: [receiverId] },
    }).exec();

    if (existingFriend) {
      throw new BadRequestException('Users are already friends');
    }

    // Kiểm tra xem đã có lời mời kết bạn chưa
    let friendRelation = await this.friendRelationModel.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
    }).exec();

    // Nếu đã có lời mời kết bạn
    if (friendRelation) {
      // Nếu lời mời đã bị từ chối trước đó, cập nhật lại thành pending
      if (friendRelation.status === 'rejected') {
        friendRelation.status = 'pending';
        friendRelation.requester = senderId as any;
        await friendRelation.save();
        
        // Thêm vào danh sách lời mời kết bạn của người nhận
        await this.userModel.findByIdAndUpdate(receiverId, {
          $addToSet: {
            friendRequests: { from: senderId, createdAt: new Date() },
          },
        }).exec();
        
        return { message: 'Friend request sent', friendRelation };
      }
      
      // Nếu lời mời đang chờ xử lý
      if (friendRelation.status === 'pending') {
        // Nếu người dùng hiện tại là người nhận lời mời trước đó
        if (friendRelation.requester.toString() === receiverId) {
          // Tự động chấp nhận lời mời
          return this.respondToFriendRequest(receiverId, (friendRelation as any)._id.toString(), FriendRequestResponse.ACCEPT);
        } else {
          throw new BadRequestException('Friend request already sent');
        }
      }
      
      // Nếu đã là bạn bè (status === 'accepted')
      throw new BadRequestException('Users are already friends');
    }

    // Tạo mới quan hệ bạn bè
    friendRelation = await this.friendRelationModel.create({
      user1: senderId as any,
      user2: receiverId as any,
      status: 'pending',
      requester: senderId as any,
      createdAt: new Date(),
    });

    // Thêm vào danh sách lời mời kết bạn của người nhận
    await this.userModel.findByIdAndUpdate(receiverId, {
      $addToSet: {
        friendRequests: { from: senderId, createdAt: new Date() },
      },
    }).exec();
    
    await this.notificationHelper.createFriendRequestNotification(senderId, receiverId);

    return { message: 'Friend request sent', friendRelation };
  }

  /**
   * Phản hồi lời mời kết bạn
   */
  async respondToFriendRequest(userId: string, requestId: string, response: FriendRequestResponse) {
    // Tìm kiếm lời mời kết bạn
    const friendRequest = await this.friendRelationModel.findById(requestId).exec();
    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Kiểm tra xem người dùng có quyền phản hồi không
    const isReceiver = (
      (friendRequest.user1.toString() === userId && friendRequest.user2.toString() === friendRequest.requester.toString()) ||
      (friendRequest.user2.toString() === userId && friendRequest.user1.toString() === friendRequest.requester.toString())
    );

    if (!isReceiver) {
      throw new BadRequestException('You are not authorized to respond to this friend request');
    }

    // Xác định người gửi và người nhận
    const requesterId = friendRequest.requester.toString();
    const receiverId = userId;

    // Xử lý phản hồi
    if (response === FriendRequestResponse.ACCEPT) {
      // Cập nhật trạng thái lời mời
      friendRequest.status = 'accepted';
      await friendRequest.save();

      // Thêm vào danh sách bạn bè của cả hai người
      await this.userModel.findByIdAndUpdate(requesterId, {
        $addToSet: { friends: receiverId },
      }).exec();      await this.userModel.findByIdAndUpdate(receiverId, {
        $addToSet: { friends: requesterId },
        $pull: { friendRequests: { from: requesterId } },
      }).exec();

      // Sửa thứ tự tham số: người chấp nhận (receiverId/userId) là người gửi thông báo
      // và người gửi lời mời (requesterId) là người nhận thông báo
      await this.notificationHelper.createFriendAcceptNotification(receiverId, requesterId);

      return { message: 'Friend request accepted' };
    } else {
      // Từ chối lời mời
      friendRequest.status = 'rejected';
      await friendRequest.save();

      // Xóa khỏi danh sách lời mời
      await this.userModel.findByIdAndUpdate(receiverId, {
        $pull: { friendRequests: { from: requesterId } },
      }).exec();

      return { message: 'Friend request rejected' };
    }
  }

  /**
   * Hủy kết bạn
   */
  async unfriend(userId: string, friendId: string) {
    // Kiểm tra xem có phải là bạn bè không
    const user = await this.userModel
      .findOne({ _id: userId, friends: { $in: [friendId] } })
      .exec();

    if (!user) {
      throw new BadRequestException('Users are not friends');
    }

    // Xóa khỏi danh sách bạn bè của cả hai người
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    }).exec();

    await this.userModel.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    }).exec();

    // Cập nhật hoặc xóa bỏ quan hệ bạn bè
    await this.friendRelationModel.findOneAndDelete({
      $or: [
        { user1: userId, user2: friendId },
        { user1: friendId, user2: userId },
      ],
      status: 'accepted',
    }).exec();

    return { message: 'Friend removed successfully' };
  }

  /**
   * Lấy danh sách bạn bè
   */
  async getFriends(userId: string, page = 1, limit = 10) {
    console.log(`Getting friends for user ${userId}, page ${page}, limit ${limit}`);
    try {
      const skip = (page - 1) * limit;
      console.log(`Skip: ${skip}, Limit: ${limit}`);

      // Kiểm tra userId có hợp lệ không
      if (!userId) {
        console.error('Invalid userId provided:', userId);
        throw new BadRequestException('Invalid user ID');
      }

      console.log(`Finding user with ID: ${userId}`);
      // Lấy người dùng với danh sách bạn bè
      const user = await this.userModel
        .findById(userId)
        .select('friends')
        .populate({
          path: 'friends',
          select: '_id fullName email avatar',
          options: {
            skip,
            limit,
          },
        })
        .exec();

      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        throw new NotFoundException('User not found');
      }

      // Đếm tổng số bạn bè
      const total = user.friends.length;
      console.log(`Found ${total} friends for user ${userId}`);

      // Định dạng kết quả trả về để phù hợp với mobile app
      return {
        items: user.friends,  // Sử dụng 'items' thay vì 'friends' để phù hợp với mobile app
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(`Error getting friends for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Lấy danh sách lời mời kết bạn
   */
  async getFriendRequests(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Lấy người dùng với danh sách lời mời kết bạn
    const user = await this.userModel
      .findById(userId)
      .select('friendRequests')
      .populate({
        path: 'friendRequests.from',
        select: '_id fullName email avatar',
        options: {
          skip,
          limit,
        },
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Đếm tổng số lời mời
    const total = user.friendRequests.length;

    // Lấy thêm thông tin về ID của quan hệ bạn bè
    const friendRequests = await Promise.all(
      user.friendRequests.slice(skip, skip + limit).map(async (request) => {
        const relation = await this.friendRelationModel.findOne({
          requester: (request.from as any)._id,
          $or: [
            { user1: userId, user2: (request.from as any)._id },
            { user1: (request.from as any)._id, user2: userId },
          ],
          status: 'pending',
        }).exec();

        return {
          _id: relation?._id,
          from: request.from,
          createdAt: request.createdAt,
        };
      })
    );

    return {
      requests: friendRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy danh sách lời mời kết bạn đã gửi
   */
  async getSentFriendRequests(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Tìm kiếm các lời mời kết bạn đã gửi
    const total = await this.friendRelationModel.countDocuments({
      requester: userId,
      status: 'pending',
    }).exec();

    const sentRequests = await this.friendRelationModel
      .find({
        requester: userId,
        status: 'pending',
      })
      .skip(skip)
      .limit(limit)
      .populate('user2', '_id fullName email avatar')
      .exec();

    return {
      requests: sentRequests.map(req => ({
        _id: req._id,
        to: req.user2,
        createdAt: req.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Hủy lời mời kết bạn đã gửi
   */
  async cancelFriendRequest(userId: string, requestId: string) {
    // Tìm kiếm lời mời kết bạn
    const friendRequest = await this.friendRelationModel.findById(requestId).exec();
    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Kiểm tra xem người dùng có phải là người gửi không
    if (friendRequest.requester.toString() !== userId) {
      throw new BadRequestException('You are not authorized to cancel this friend request');
    }

    // Xóa lời mời kết bạn
    await friendRequest.deleteOne();

    // Xóa khỏi danh sách lời mời của người nhận
    const receiverId = friendRequest.user1.toString() === userId
      ? friendRequest.user2.toString()
      : friendRequest.user1.toString();

    await this.userModel.findByIdAndUpdate(receiverId, {
      $pull: { friendRequests: { from: userId } },
    }).exec();

    return { message: 'Friend request cancelled successfully' };
  }
}
