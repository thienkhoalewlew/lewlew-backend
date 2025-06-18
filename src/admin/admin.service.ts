import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Report, ReportDocument } from '../reports/schemas/report.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly postsService: PostsService,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all statistics in parallel
    const [
      userStats,
      postStats,
      reportStats,
      engagementStats,
    ] = await Promise.all([
      this.getUserStats(),
      this.getPostStats(),
      this.getReportStats(),
      this.getEngagementStats(),
    ]);

    return {
      users: userStats,
      posts: postStats,
      reports: reportStats,
      engagement: engagementStats,
      systemHealth: {
        status: 'healthy',
        lastUpdated: now,
      },
    };
  }

  async getUserStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfToday } }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfWeek } }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }).exec(),
    ]);    return {
      total: totalUsers,
      newToday: newUsersToday,
      newThisWeek: newUsersThisWeek,
      newThisMonth: newUsersThisMonth,
      activeUsers: totalUsers, // All registered users considered as total active base
    };
  }

  async getPostStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPosts,
      newPostsToday,
      newPostsThisWeek,
      newPostsThisMonth,
      activePosts,
      expiredPosts,
      deletedPosts,
    ] = await Promise.all([
      this.postModel.countDocuments().exec(),
      this.postModel.countDocuments({ createdAt: { $gte: startOfToday } }).exec(),
      this.postModel.countDocuments({ createdAt: { $gte: startOfWeek } }).exec(),
      this.postModel.countDocuments({ createdAt: { $gte: startOfMonth } }).exec(),
      this.postModel.countDocuments({ 
        expiresAt: { $gt: now }, 
        isDeleted: { $ne: true } 
      }).exec(),
      this.postModel.countDocuments({
        expiresAt: { $lte: now }, 
        isDeleted: { $ne: true } 
      }).exec(),
      this.postModel.countDocuments({ isDeleted: true }).exec(),
    ]);

    return {
      total: totalPosts,
      newToday: newPostsToday,
      newThisWeek: newPostsThisWeek,
      newThisMonth: newPostsThisMonth,
      activePosts,
      expiredPosts,
      deletedPosts,
    };
  }

  async getReportStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      rejectedReports,
      autoResolvedReports,
      recentReports,
    ] = await Promise.all([
      this.reportModel.countDocuments().exec(),
      this.reportModel.countDocuments({ status: 'pending' }).exec(),
      this.reportModel.countDocuments({ status: 'resolved' }).exec(),
      this.reportModel.countDocuments({ status: 'rejected' }).exec(),
      this.reportModel.countDocuments({ autoResolved: true }).exec(),
      this.reportModel.countDocuments({ createdAt: { $gte: startOfDay } }).exec(),
    ]);

    const autoResolutionRate = totalReports > 0 
      ? ((autoResolvedReports / totalReports) * 100).toFixed(2) 
      : '0.00';

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      rejectedReports,
      autoResolvedReports,
      recentReports,
      autoResolutionRate,
    };
  }

  async getEngagementStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get total likes across all posts
    const likesAggregation = await this.postModel.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likeCount' },
        }
      }
    ]);

    // Get likes from today
    const likesTodayAggregation = await this.postModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          likesToday: { $sum: '$likeCount' },
        }
      }
    ]);

    const [
      totalComments,
      commentsToday,
      totalPosts,
    ] = await Promise.all([
      this.commentModel.countDocuments().exec(),
      this.commentModel.countDocuments({ createdAt: { $gte: startOfToday } }).exec(),
      this.postModel.countDocuments().exec(),
    ]);

    const totalLikes = likesAggregation[0]?.totalLikes || 0;
    const likesToday = likesTodayAggregation[0]?.likesToday || 0;
    const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts) : 0;
    const avgCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts) : 0;

    return {
      totalLikes,
      totalComments,
      likesToday,
      commentsToday,
      avgLikesPerPost: Number(avgLikesPerPost.toFixed(1)),
      avgCommentsPerPost: Number(avgCommentsPerPost.toFixed(1)),
    };
  }

  async getRecentUsers(limit: number = 10) {
    const recentUsers = await this.userModel
      .find({}, { password: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return {
      users: recentUsers,
      count: recentUsers.length,
    };
  }

  async getPendingReportsSummary() {
    const pendingReports = await this.reportModel
      .find({ status: 'pending' })
      .populate('postId', 'caption imageUrl')
      .populate('reporterId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    const summary = await this.reportModel.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      reports: pendingReports,
      summary,
      totalPending: pendingReports.length,
    };
  }

  async performSystemCheck() {
    const now = new Date();
    const stats = await this.getDashboardStats();
    
    const metrics = {
      totalUsers: stats.users.total,
      totalPosts: stats.posts.total,
      totalReports: stats.reports.totalReports,
      newUsersToday: stats.users.newToday,
      newPostsToday: stats.posts.newToday,
      newReportsToday: stats.reports.recentReports,
      pendingReports: stats.reports.pendingReports,
    };

    const healthIndicators = {
      userGrowthRate: ((stats.users.newToday / stats.users.total) * 100).toFixed(2),
      reportRate: ((stats.reports.totalReports / stats.posts.total) * 100).toFixed(2),
      pendingReportRate: ((stats.reports.pendingReports / stats.reports.totalReports) * 100).toFixed(2),
      systemStatus: stats.reports.pendingReports > 20 ? 'warning' : 'healthy',
    };

    const recommendations: string[] = [];
    if (stats.reports.pendingReports > 20) {
      recommendations.push('High number of pending reports detected. Consider increasing moderation team.');
    }
    if (stats.users.newToday > 50) {
      recommendations.push('High user registration activity. Monitor for spam accounts.');
    }
    if (recommendations.length === 0) {
      recommendations.push('System is operating within normal parameters.');
    }

    return {
      timestamp: now,
      metrics,
      healthIndicators,
      recommendations,
    };
  }

  // Location Analytics Methods
  async getLocationAnalytics() {
    const [
      totalLocations,
      mostActiveLocation,
      topLocations,
      heatmapData,
      recentPosts,
      locationGrowth,
      geographicDistribution
    ] = await Promise.all([
      this.getTotalLocations(),
      this.getMostActiveLocation(),
      this.getTopLocations(10),
      this.getHeatmapData(),
      this.getRecentPostsByLocation(10),
      this.getLocationGrowth('30d'),
      this.getGeographicDistribution()
    ]);

    return {
      totalLocations,
      mostActiveLocation,
      topLocations,
      heatmapData,
      recentPosts,
      locationGrowth,
      geographicDistribution
    };
  }

  private async getTotalLocations(): Promise<number> {
    const uniqueLocations = await this.postModel.aggregate([
      {
        $match: {
          $and: [
            { 'location.placeName': { $exists: true } },
            { 'location.placeName': { $ne: null } },
            { 'location.placeName': { $ne: '' } },
            { isDeleted: { $ne: true } }
          ]
        }
      },
      {
        $group: {
          _id: '$location.placeName'
        }
      },
      {
        $count: 'total'
      }
    ]);

    return uniqueLocations[0]?.total || 0;
  }
  private async getMostActiveLocation() {
    const pipeline = [
      {
        $match: {
          $and: [
            { 'location.placeName': { $exists: true } },
            { 'location.placeName': { $ne: null } },
            { 'location.placeName': { $ne: '' } },
            { isDeleted: { $ne: true } }
          ]
        }
      },
      {
        $group: {
          _id: '$location.placeName',
          postCount: { $sum: 1 },
          coordinates: { $first: '$location.coordinates' },
          totalLikes: { $sum: { $size: '$likes' } },
          userIds: { $addToSet: '$user' },
          lastActivity: { $max: '$createdAt' }
        }
      },{
        $addFields: {
          userCount: { $size: '$userIds' },
          averageLikes: { $divide: ['$totalLikes', '$postCount'] }
        }
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: 1
      }
    ];    const result = await this.postModel.aggregate(pipeline as any);
    const location = result[0];

    if (!location) {
      return {
        locationName: 'No data',
        coordinates: [0, 0],
        postCount: 0,
        userCount: 0,
        engagementRate: 0,
        averageLikes: 0,
        averageComments: 0,
        lastActivity: new Date()
      };
    }

    // Calculate average comments for this location
    const comments = await this.commentModel.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postData'
        }
      },
      {
        $match: {
          'postData.location.placeName': location._id,
          'postData.isDeleted': { $ne: true }
        }
      },
      {
        $group: {
          _id: '$post',
          commentCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          averageComments: { $avg: '$commentCount' }
        }
      }
    ]);    return {
      locationName: location._id,
      coordinates: location.coordinates || [0, 0],
      postCount: location.postCount || 0,
      userCount: location.userCount || 0,
      engagementRate: location.postCount > 0 
        ? parseFloat(((location.totalLikes / location.postCount) * 100).toFixed(1))
        : 0,
      averageLikes: location.averageLikes ? parseFloat(location.averageLikes.toFixed(1)) : 0,
      averageComments: comments[0]?.averageComments ? parseFloat(comments[0].averageComments.toFixed(1)) : 0,
      lastActivity: location.lastActivity || new Date()
    };
  }
  async getTopLocations(limit: number = 10) {
    const pipeline = [
      {
        $match: {
          $and: [
            { 'location.placeName': { $exists: true } },
            { 'location.placeName': { $ne: null } },
            { 'location.placeName': { $ne: '' } },
            { isDeleted: { $ne: true } }
          ]
        }
      },
      {
        $group: {
          _id: '$location.placeName',
          postCount: { $sum: 1 },
          coordinates: { $first: '$location.coordinates' },
          totalLikes: { $sum: { $size: '$likes' } },
          userIds: { $addToSet: '$user' },
          lastActivity: { $max: '$createdAt' }
        }
      },      {
        $addFields: {
          userCount: { $size: '$userIds' },
          averageLikes: { 
            $cond: [
              { $eq: ["$postCount", 0] },
              0,
              { $divide: ['$totalLikes', '$postCount'] }
            ]
          },
          engagementRate: { 
            $cond: [
              { $eq: ["$postCount", 0] },
              0,
              { $multiply: [{ $divide: ['$totalLikes', '$postCount'] }, 10] }
            ]
          }
        }
      },
      {
        $sort: { postCount: -1 }
      },
      {
        $limit: limit
      }
    ];

    const results = await this.postModel.aggregate(pipeline as any);      return results.map(location => ({
      locationName: location._id || 'Unknown Location',
      coordinates: Array.isArray(location.coordinates) ? location.coordinates : [0, 0],
      postCount: location.postCount || 0,
      userCount: location.userCount || 0,
      engagementRate: typeof location.engagementRate === 'number' ? parseFloat(location.engagementRate.toFixed(1)) : 0,
      averageLikes: typeof location.averageLikes === 'number' ? parseFloat(location.averageLikes.toFixed(1)) : 0,
      averageComments: 0, // Will be calculated separately if needed
      lastActivity: location.lastActivity || new Date()
    }));
  }

  async getPostsByLocation(bounds?: { north: number; south: number; east: number; west: number }) {
    let matchCondition: any = {
      $and: [
        { 'location.coordinates': { $exists: true } },
        { 'location.coordinates': { $ne: null } },
        { 'location.placeName': { $exists: true } },
        { 'location.placeName': { $ne: null } },
        { 'location.placeName': { $ne: '' } },
        { isDeleted: { $ne: true } }
      ]
    };

    if (bounds) {
      matchCondition.$and.push(
        { 'location.coordinates.1': { $gte: bounds.south, $lte: bounds.north } },
        { 'location.coordinates.0': { $gte: bounds.west, $lte: bounds.east } }
      );
    }

    const posts = await this.postModel.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },{
        $project: {
          coordinates: '$location.coordinates',
          placeName: '$location.placeName',
          postId: '$_id',
          userId: '$user',
          userName: { $arrayElemAt: ['$user.fullName', 0] },
          userAvatar: { $arrayElemAt: ['$user.avatar', 0] },
          imageUrl: '$imageUrl',
          caption: '$caption',
          likes: { $size: '$likes' },
          commentCount: { $literal: 0 }, // Use $literal to set a value, not exclude field
          createdAt: '$createdAt'
        }
      },
      { $limit: 1000 } // Limit for performance
    ]);
    return posts.map(post => ({
      id: post.postId?.toString() || '',
      coordinates: post.coordinates || [0, 0],
      placeName: post.placeName || '',
      postId: post.postId?.toString() || '',
      userId: post.userId?.toString() || '',
      userName: post.userName || 'Unknown User',
      userAvatar: post.userAvatar || '',
      imageUrl: post.imageUrl || '',
      caption: post.caption || '',
      likes: post.likes || 0,
      comments: post.commentCount || 0,
      createdAt: post.createdAt || new Date()
    }));
  }

  async getHeatmapData() {
    const pipeline = [
      {
        $match: {
          $and: [
            { 'location.coordinates': { $exists: true } },
            { 'location.coordinates': { $ne: null } },
            { isDeleted: { $ne: true } }
          ]
        }
      },
      {
        $group: {
          _id: {
            // Group by approximate location (0.01 degree precision ~1km)
            lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
            lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }
          },
          postCount: { $sum: 1 },
          weight: { $sum: { $size: '$likes' } },
          locationName: { $first: '$location.placeName' }
        }
      },
      {
        $project: {
          lat: '$_id.lat',
          lng: '$_id.lng',
          postCount: '$postCount',
          weight: { $add: ['$weight', '$postCount'] }, // Weight = likes + posts
          locationName: '$locationName'
        }
      },
      { $sort: { weight: -1 } },
      { $limit: 500 } // Limit for performance
    ];

    return await this.postModel.aggregate(pipeline as any);
  }

  private async getRecentPostsByLocation(limit: number = 10) {
    return await this.getPostsByLocation();
  }

  async getLocationGrowth(period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          $and: [
            { 'location.placeName': { $exists: true } },
            { 'location.placeName': { $ne: null } },
            { 'location.placeName': { $ne: '' } },
            { createdAt: { $gte: startDate } },
            { isDeleted: { $ne: true } }
          ]
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          totalPosts: { $sum: 1 },
          locations: { $addToSet: '$location.placeName' }
        }
      },
      {
        $addFields: {
          newLocations: { $size: '$locations' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          newLocations: '$newLocations',
          totalPosts: '$totalPosts'        }
      },      { $sort: { date: 1 } }
    ];

    return await this.postModel.aggregate(pipeline as any);
  }

  async getGeographicDistribution() {
    const pipeline = [
      {
        $match: {
          $and: [
            { 'location.placeName': { $exists: true } },
            { 'location.placeName': { $ne: null } },
            { 'location.placeName': { $ne: '' } },
            { isDeleted: { $ne: true } }
          ]
        }
      },
      {
        $group: {
          _id: '$location.placeName',
          count: { $sum: 1 }
        }      },      {
        $sort: { count: -1 }
      },      { $limit: 20 }
    ];

    const results = await this.postModel.aggregate(pipeline as any);
    const totalPosts = results.reduce((sum, item) => sum + item.count, 0);

    return results.map(item => ({
      region: item._id,
      count: item.count,
      percentage: parseFloat(((item.count / totalPosts) * 100).toFixed(1))
    }));
  }  /**
   * Admin delete post method
   */  async adminDeletePost(postId: string): Promise<void> {
    console.log(`🗑️ AdminService: Starting hard delete post for ID: ${postId}`);
    
    const post = await this.postModel.findById(postId);
    if (!post) {
      console.log(`🗑️ AdminService: Post not found for ID: ${postId}`);
      throw new NotFoundException('Post not found');
    }

    console.log(`🗑️ AdminService: Found post, proceeding with hard delete`);

    // Hard delete: permanently remove from database
    await this.postsService.hardDeletePost(postId, 'admin');

    console.log(`🗑️ AdminService: Post ${postId} successfully hard deleted by admin`);
  }
}
