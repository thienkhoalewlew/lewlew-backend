import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportStatus } from './schemas/report.schema';
import { AiAnalystService } from '../ai-analysis/ai-analyst.service';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly aiAnalystService: AiAnalystService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Report a post' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Report created successfully',
    schema: {
      example: {
        id: '64f1a2b3c4d5e6f7a8b9c0d1',
        postId: '6571a2d3e87cf87df032a9b2',
        reporterId: '6571a2d3e87cf87df032a9b1',
        reason: 'spam',
        description: 'This post contains spam content',
        status: 'pending',
        createdAt: '2025-06-08T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data or already reported' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found' })
  async createReport(@Body() createReportDto: CreateReportDto, @Req() req) {
    return this.reportsService.createReport(createReportDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @ApiQuery({ name: 'reason', required: false, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of reports with pagination',
    schema: {
      example: {
        reports: [
          {
            id: '64f1a2b3c4d5e6f7a8b9c0d1',
            postId: {
              id: '6571a2d3e87cf87df032a9b2',
              caption: 'Sample post content',
              imageUrl: null
            },
            reporterId: {
              id: 'user_id_example',
              fullName: 'User Name',
              email: 'user@domain.com'
            },
            reason: 'spam',
            status: 'pending',
            aiConfidenceScore: 0,
            aiPrediction: 'AI prediction example',
            createdAt: '2025-01-01T00:00:00.000Z'
          }
        ],
        pagination: {
          current: 1,
          total: 5,
          count: 45,
          limit: 10
        }
      }
    }
  })
  async getReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: ReportStatus,
    @Query('reason') reason?: string,
  ) {
    return this.reportsService.getReports(page, limit, status, reason);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get report statistics (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Report statistics',
    schema: {
      example: {
        totalReports: 150,
        pendingReports: 25,
        resolvedReports: 100,
        rejectedReports: 25,
        autoResolvedReports: 60,
        recentReports: 12,
        autoResolutionRate: '40.00',
        reportsByReason: [
          { _id: 'spam', count: 45 },
          { _id: 'harassment', count: 30 },
          { _id: 'inappropriate_content', count: 25 }
        ]
      }
    }
  })
  async getReportStats() {
    return this.reportsService.getReportStats();
  }
  @Get('my-reports')
  @ApiOperation({ summary: 'Get current user reports' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User reports with pagination',
    schema: {
      example: {
        reports: [
          {
            id: '64f1a2b3c4d5e6f7a8b9c0d1',
            postId: {
              id: '6571a2d3e87cf87df032a9b2',
              caption: 'This is a spam post promoting fake products',
              imageUrl: null,
              user: {
                id: '6571a2d3e87cf87df032a9b3',
                fullName: 'Spam User',
                username: 'spamuser123'
              },
              createdAt: '2025-06-08T10:00:00.000Z'            },
            reason: 'spam',
            description: 'Report description example',
            status: 'pending',
            aiConfidenceScore: 0,
            aiPrediction: 'AI prediction example',
            aiAnalysis: {
              textAnalysis: {
                toxicity: 0,
                spam: 0,
                inappropriateContent: 0,
                hateSpeech: 0
              },
              metadata: {
                analyzedAt: '2025-01-01T00:00:00.000Z',
                model: 'ai-model-name'
              }
            },
            createdAt: '2025-06-08T10:30:00.000Z',
            updatedAt: '2025-06-08T10:30:00.000Z'
          },
          {
            id: '64f1a2b3c4d5e6f7a8b9c0d2',
            postId: {
              id: '6571a2d3e87cf87df032a9b4',
              caption: 'Inappropriate content that violates guidelines',
              imageUrl: null,
              user: {
                id: '6571a2d3e87cf87df032a9b5',
                fullName: 'Another User',
                username: 'anotheruser'            },
              createdAt: '2025-01-01T00:00:00.000Z'
            },
            reason: 'inappropriate_content',
            description: 'Report description example',
            status: 'resolved',
            aiConfidenceScore: 0,
            aiPrediction: 'AI prediction example',
            aiAnalysis: {
              textAnalysis: {
                toxicity: 0,
                spam: 0,
                inappropriateContent: 0,
                hateSpeech: 0
              },
              metadata: {
                analyzedAt: '2025-01-01T00:00:00.000Z',
                model: 'ai-model-name'
              }
            },
            reviewedBy: 'reviewer_id_example',
            reviewedAt: '2025-06-08T09:00:00.000Z',
            reviewComment: 'Post has been reviewed and removed for violating community guidelines',
            createdAt: '2025-06-07T15:35:00.000Z',
            updatedAt: '2025-06-08T09:00:00.000Z'
          }
        ],
        pagination: {
          current: 1,
          total: 5,
          count: 2,
          limit: 10,
          hasNext: false,
          hasPrev: false
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized access' })
  async getUserReports(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reportsService.getUserReports(req.user.userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Report details',
    schema: {
      example: {
        id: 'report_id_example',
        postId: {
          id: 'post_id_example',
          caption: 'Post content example',
          imageUrl: null,
          user: 'user_id_example'
        },
        reporterId: {
          id: 'user_id_example',
          fullName: 'User Name',
          email: 'user@domain.com'
        },
        reason: 'spam',
        description: 'Report description example',
        status: 'pending',
        aiConfidenceScore: 0,
        aiPrediction: 'AI prediction example',
        aiAnalysis: {
          textAnalysis: {
            toxicity: 0,
            spam: 0,
            inappropriateContent: 0,
            hateSpeech: 0
          },
          metadata: {
            analyzedAt: '2025-01-01T00:00:00.000Z',
            model: 'ai-model-name'
          }
        },
        createdAt: '2025-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found' })
  async getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }
  @Put(':id/status')
  @ApiOperation({ summary: 'Update report status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Report status updated successfully',
    schema: {
      example: {
        id: '64f1a2b3c4d5e6f7a8b9c0d1',
        status: 'resolved',
        reviewedBy: '6571a2d3e87cf87df032a9b4',
        reviewedAt: '2025-06-08T11:00:00.000Z',
        reviewComment: 'Report reviewed and post removed'
      }
    }  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found' })
  async updateReportStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReportStatusDto,
    @Req() req
  ) {
    return this.reportsService.updateReportStatus(id, updateDto, req.user.userId);
  }
}
