import { Controller, Get, Post, Query, UseGuards, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}
  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprehensive admin dashboard statistics covering users, posts, reports, engagement metrics and system health indicators',
    schema: {
      example: {
        users: {
          total: 0,
          newToday: 0,
          newThisWeek: 0,
          newThisMonth: 0,
          activeUsers: 0
        },
        posts: {
          total: 0,
          newToday: 0,
          newThisWeek: 0,
          newThisMonth: 0,
          activePosts: 0,
          expiredPosts: 0,
          deletedPosts: 0
        },
        reports: {
          totalReports: 0,
          pendingReports: 0,
          resolvedReports: 0,
          rejectedReports: 0,
          autoResolvedReports: 0,
          recentReports: 0,
          autoResolutionRate: '0.00'
        },
        engagement: {
          totalLikes: 0,
          totalComments: 0,
          likesToday: 0,
          commentsToday: 0,
          avgLikesPerPost: 0,
          avgCommentsPerPost: 0
        },
        systemHealth: {
          status: 'healthy',
          lastUpdated: '2025-01-01T00:00:00.000Z'
        }
      }
    }
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
  @Get('users/stats')
  @ApiOperation({ summary: 'Get detailed user statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed user statistics including total, daily/weekly/monthly registrations, and active user estimates',
    schema: {
      example: {
        total: 0,
        newToday: 0,
        newThisWeek: 0, 
        newThisMonth: 0,
        activeUsers: 0
      }
    }
  })
  async getUserStats() {
    return this.adminService.getUserStats();
  }
  @Get('posts/stats')
  @ApiOperation({ summary: 'Get detailed post statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprehensive post statistics including total posts, daily/weekly/monthly creation rates, active vs expired posts, and deletion counts',
    schema: {
      example: {
        total: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        activePosts: 0,
        expiredPosts: 0,
        deletedPosts: 0
      }
    }
  })
  async getPostStats() {
    return this.adminService.getPostStats();
  }  @Get('engagement/stats')
  @ApiOperation({ summary: 'Get engagement statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'User engagement metrics including total likes and comments across platform, daily activity, and average engagement per post',
    schema: {
      example: {
        totalLikes: 0,
        totalComments: 0,
        likesToday: 0,
        commentsToday: 0,
        avgLikesPerPost: 0,
        avgCommentsPerPost: 0
      }
    }
  })
  async getEngagementStats() {
    return this.adminService.getEngagementStats();
  }
  @Get('users/recent')
  @ApiOperation({ summary: 'Get recent users' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of recently registered users (newest first) with basic profile information excluding sensitive data',
    schema: {
      example: {
        users: [
          {
            id: 'user_id_example',
            fullName: 'User Name',
            username: 'username',
            email: 'user@domain.com',
            avatar: null,
            isActive: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ],
        count: 0
      }
    }
  })
  async getRecentUsers(@Query('limit') limit: number = 10) {
    return this.adminService.getRecentUsers(limit);
  }
  @Get('reports/pending')
  @ApiOperation({ summary: 'Get pending reports summary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Summary of pending reports including recent reports with post/user details and categorized statistics by reason',
    schema: {
      example: {
        reports: [
          {
            id: 'report_id_example',
            postId: {
              id: 'post_id_example',
              caption: 'Post content example',
              imageUrl: null
            },
            reporterId: {
              id: 'user_id_example',
              fullName: 'Reporter Name',
              email: 'user@domain.com'
            },
            reason: 'spam',
            status: 'pending',
            createdAt: '2025-01-01T00:00:00.000Z'
          }
        ],
        summary: [
          { _id: 'spam', count: 0 },
          { _id: 'inappropriate_content', count: 0 },
          { _id: 'harassment', count: 0 }
        ],
        totalPending: 0
      }
    }
  })
  async getPendingReportsSummary() {
    return this.adminService.getPendingReportsSummary();
  }
  @Post('actions/system-check')
  @ApiOperation({ summary: 'Perform system health check' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprehensive system health check results including metrics, health indicators, and automated recommendations for system optimization',
    schema: {
      example: {
        timestamp: '2025-01-01T00:00:00.000Z',
        metrics: {
          totalUsers: 0,
          totalPosts: 0,
          totalReports: 0,
          newUsersToday: 0,
          newPostsToday: 0,
          newReportsToday: 0,
          pendingReports: 0
        },
        healthIndicators: {
          userGrowthRate: 0,
          reportRate: 0,
          pendingReportRate: 0,
          systemStatus: 'healthy'
        },
        recommendations: []
      }
    }
  })
  async performSystemCheck() {
    return this.adminService.performSystemCheck();
  }

  // Location Analytics Endpoints
  @Get('analytics/locations')
  @ApiOperation({ summary: 'Get comprehensive location analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Complete location analytics including top locations, geographic distribution, and activity metrics',
    schema: {
      example: {
        totalLocations: 0,
        mostActiveLocation: {
          locationName: 'Location Name',
          coordinates: [0, 0],
          postCount: 0,
          userCount: 0,
          engagementRate: 0,
          averageLikes: 0,
          averageComments: 0,
          lastActivity: '2025-01-01T00:00:00.000Z'
        },
        topLocations: [],
        heatmapData: [],
        recentPosts: [],
        locationGrowth: [],
        geographicDistribution: []
      }
    }
  })
  async getLocationAnalytics() {
    return this.adminService.getLocationAnalytics();
  }

  @Get('analytics/locations/top')
  @ApiOperation({ summary: 'Get top locations by activity' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of most active locations ranked by post count and engagement',
    schema: {
      example: [
        {
          locationName: 'Location Name',
          coordinates: [0, 0],
          postCount: 0,
          userCount: 0,
          engagementRate: 0,
          averageLikes: 0,
          averageComments: 0,
          lastActivity: '2025-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  async getTopLocations(@Query('limit') limit: number = 10) {
    return this.adminService.getTopLocations(limit);
  }

  @Get('analytics/posts/by-location')
  @ApiOperation({ summary: 'Get posts by geographic location' })
  @ApiResponse({ 
    status: 200, 
    description: 'Posts filtered by geographic bounds with location and engagement data',
    schema: {
      example: [
        {
          id: 'location_id_example',
          coordinates: [0, 0],
          placeName: 'Location Name',
          postId: 'post_id_example',
          userId: 'user_id_example',
          userName: 'User Name',
          userAvatar: null,
          imageUrl: null,
          caption: 'Post caption example',
          likes: 0,
          comments: 0,
          createdAt: '2025-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  async getPostsByLocation(
    @Query('north') north?: number,
    @Query('south') south?: number,
    @Query('east') east?: number,
    @Query('west') west?: number,
  ) {
    const bounds = north && south && east && west ? { north, south, east, west } : undefined;
    return this.adminService.getPostsByLocation(bounds);
  }

  @Get('analytics/heatmap')
  @ApiOperation({ summary: 'Get heatmap data for visualization' })
  @ApiResponse({ 
    status: 200, 
    description: 'Heatmap data points with coordinates and activity weight for geographic visualization',
    schema: {
      example: [
        {
          lat: 0,
          lng: 0,
          weight: 0,
          postCount: 0,
          locationName: 'Location Name'
        }
      ]
    }
  })
  async getHeatmapData() {
    return this.adminService.getHeatmapData();
  }

  @Get('analytics/locations/growth')
  @ApiOperation({ summary: 'Get location activity growth over time' })  @ApiResponse({ 
    status: 200, 
    description: 'Time series data showing new locations and post growth over specified period',
    schema: {
      example: [
        {
          date: '2025-01-01',
          newLocations: 0,
          totalPosts: 0
        }
      ]
    }
  })
  async getLocationGrowth(@Query('period') period: '7d' | '30d' | '90d' = '30d') {
    return this.adminService.getLocationGrowth(period);
  }

  @Get('analytics/locations/distribution')
  @ApiOperation({ summary: 'Get geographic distribution of activity' })
  @ApiResponse({ 
    status: 200, 
    description: 'Distribution of posts and users across different geographic regions',
    schema: {
      example: [
        {
          region: 'Region Name',
          count: 0,
          percentage: 0
        }
      ]
    }
  })
  async getGeographicDistribution() {
    return this.adminService.getGeographicDistribution();
  }
  @Delete('posts/:id')
  @ApiOperation({ summary: 'Admin delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Post deleted successfully',
    schema: {
      example: {
        message: 'Post deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async adminDeletePost(@Param('id') id: string) {
    console.log(`🗑️ AdminController: Delete post request for ID: ${id}`);
    
    try {
      await this.adminService.adminDeletePost(id);
      console.log(`🗑️ AdminController: Post deleted successfully for ID: ${id}`);
      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error(`🗑️ AdminController: Error deleting post ${id}:`, error);
      throw error;
    }
  }
}
