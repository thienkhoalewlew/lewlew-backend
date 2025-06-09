import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument, ReportStatus } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { AiAnalystService } from '../ai-analysis/ai-analyst.service';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private aiAnalystService: AiAnalystService,
    private notificationHelper: NotificationHelperService,
    private postsService: PostsService,
  ) {}

  /**
   * Tạo report mới
   */
  async createReport(createReportDto: CreateReportDto, reporterId: string): Promise<Report> {
    // Kiểm tra post có tồn tại không
    const post = await this.postModel.findById(createReportDto.postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Kiểm tra user không thể report chính bài viết của mình
    if (post.user.toString() === reporterId) {
      throw new BadRequestException('You cannot report your own post');
    }

    // Kiểm tra user đã report bài viết này chưa
    const existingReport = await this.reportModel.findOne({
      postId: createReportDto.postId,
      reporterId: reporterId,
    }).exec();

    if (existingReport) {
      throw new BadRequestException('You have already reported this post');
    }    // Tạo report mới
    const newReport = new this.reportModel({
      ...createReportDto,
      reporterId,
      status: ReportStatus.PENDING,
    });

    const savedReport = await newReport.save();

    // Phân tích AI trong background
    this.performAIAnalysis((savedReport._id as any).toString(), post);

    return savedReport;
  }  /**
   * Thực hiện phân tích AI với Sightengine
   */
  private async performAIAnalysis(reportId: string, post: PostDocument) {
    try {
      const report = await this.reportModel.findById(reportId).exec();
      if (!report) {
        this.logger.warn(`Report ${reportId} not found for AI analysis`);
        return;
      }

      this.logger.log(`Starting AI analysis for report ${reportId}`);

      // Kiểm tra nếu post có hình ảnh
      if (!post.imageUrl) {
        this.logger.log(`Post ${post._id} has no image to analyze`);
        return;
      }

      // Phân tích ảnh với Sightengine
      const analysisResult = await this.aiAnalystService.analyzeImage(
        post.imageUrl,
        report.reason
      );

      this.logger.log(`AI analysis completed for report ${reportId}: confidence=${analysisResult.confidence}, violation=${analysisResult.isViolation}`);

      // Cập nhật report với kết quả phân tích
      await this.reportModel.findByIdAndUpdate(reportId, {
        aiConfidenceScore: analysisResult.confidence,
        aiPrediction: analysisResult.isViolation ? 'violation' : 'safe',
        aiAnalysis: {
          isViolation: analysisResult.isViolation,
          violationType: analysisResult.violationType,
          message: analysisResult.message,
          provider: analysisResult.provider,
          timestamp: analysisResult.timestamp,
          rawData: analysisResult.rawData
        },
      });

      // Nếu AI phát hiện vi phạm và confidence cao, tự động xử lý
      if (analysisResult.isViolation && this.aiAnalystService.shouldAutoDelete(analysisResult.confidence)) {
        this.logger.log(`Auto-resolving post ${post._id} due to high AI confidence (${analysisResult.confidence})`);
        await this.autoResolveReport(reportId, post);
      } else {
        this.logger.log(`Post ${post._id} requires manual review (confidence: ${analysisResult.confidence})`);
      }

    } catch (error) {
      this.logger.error(`Error performing AI analysis for report ${reportId}:`, error);
      
      // Cập nhật report với thông tin lỗi
      try {
        await this.reportModel.findByIdAndUpdate(reportId, {
          aiAnalysis: {
            error: error?.message || 'AI analysis failed',
            timestamp: new Date(),
            fallbackAnalysis: true,
            isViolation: false
          },
          aiConfidenceScore: 0,
          aiPrediction: 'error'
        });      } catch (updateError) {
        this.logger.error(`Failed to update report ${reportId} with error info:`, updateError);
      }
    }
  }
  /**
   * Tự động xử lý report
   */
  private async autoResolveReport(reportId: string, post: PostDocument) {
    try {
      // Lấy thông tin report và reporter
      const report = await this.reportModel.findById(reportId)
        .populate('reporterId', '_id fullName')
        .exec();
      
      if (!report) return;

      const reporter = report.reporterId as any;

      // Soft delete bài viết thay vì hard delete
      const reason = `Auto-removed: ${this.getReasonDisplayText(report.reason)} (AI confidence: ${report.aiConfidenceScore})`;
      await this.postsService.softDeletePostByReport(
        (post._id as any).toString(),
        reason,
        'system' // moderator ID for auto-resolution
      );
      // Cập nhật status report
      await this.reportModel.findByIdAndUpdate(reportId, {
        status: ReportStatus.RESOLVED,
        autoResolved: true,
        reviewedAt: new Date(),
        reviewComment: 'Automatically resolved by AI analysis due to high confidence violation detection.',
      });

      // Gửi thông báo cho chủ bài viết
      await this.notificationHelper.createPostRemovedNotification(
        post.user.toString(),
        (post._id as any).toString(),
        'Your post has been automatically removed due to policy violations detected by our AI system.'
      );

      // Gửi thông báo cho người report
      if (reporter) {
        await this.notificationHelper.createReportApprovedNotification(
          reporter._id.toString(),
          (post._id as any).toString(),
          this.getReasonDisplayText(report.reason)
        );
      }

      console.log(`🗑️ Post ${post._id} automatically soft-deleted due to AI analysis with confidence ${report.aiConfidenceScore}`);
      this.logger.log(`🤖 Auto-resolved report ${reportId} - Post ${post._id} soft-deleted with AI confidence ${report.aiConfidenceScore}`);
    } catch (error) {
      console.error('Error auto-resolving report:', error);
    }
  }

  /**
   * Lấy danh sách reports (cho admin)
   */
  async getReports(
    page: number = 1,
    limit: number = 10,
    status?: ReportStatus,
    reason?: string
  ) {
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (reason) {
      query.reason = reason;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find(query)
        .populate('postId', 'caption imageUrl createdAt')
        .populate('reporterId', 'fullName email avatar')
        .populate('reviewedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(query).exec(),
    ]);

    return {
      reports,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
        limit,
      },
    };
  }

  /**
   * Lấy thống kê reports
   */
  async getReportStats() {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      rejectedReports,
      autoResolvedReports,
      reportsByReason,
      recentReports
    ] = await Promise.all([
      this.reportModel.countDocuments().exec(),
      this.reportModel.countDocuments({ status: ReportStatus.PENDING }).exec(),
      this.reportModel.countDocuments({ status: ReportStatus.RESOLVED }).exec(),
      this.reportModel.countDocuments({ status: ReportStatus.REJECTED }).exec(),
      this.reportModel.countDocuments({ autoResolved: true }).exec(),
      this.reportModel.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).exec(),
      this.reportModel.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }).exec()
    ]);

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      rejectedReports,
      autoResolvedReports,
      reportsByReason,
      recentReports,
      autoResolutionRate: totalReports > 0 ? (autoResolvedReports / totalReports * 100).toFixed(2) : 0,
    };
  }
  /**
   * Cập nhật status report (cho admin)
   */
  async updateReportStatus(
    reportId: string,
    updateDto: UpdateReportStatusDto,
    reviewerId: string
  ): Promise<Report> {
    const report = await this.reportModel.findById(reportId)
      .populate('postId')
      .populate('reporterId', '_id fullName')
      .exec();
    
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const post = report.postId as any;
    const reporter = report.reporterId as any;
    // Xử lý theo từng trạng thái
    switch (updateDto.status) {
      case ReportStatus.RESOLVED:
        // Soft delete bài viết nếu report được chấp nhận
        if (post) {
          const reason = `Manual removal: ${this.getReasonDisplayText(report.reason)}${updateDto.reviewComment ? ` - ${updateDto.reviewComment}` : ''}`;
          
          await this.postsService.softDeletePostByReport(
            (post._id as any).toString(),
            reason,
            reviewerId
          );
          
          this.logger.log(`🗑️ Post ${post._id} soft-deleted by moderator ${reviewerId} for report ${reportId}`);
          
          // Thông báo cho chủ bài viết
          await this.notificationHelper.createPostRemovedNotification(
            post.user.toString(),
            (post._id as any).toString(),
            updateDto.reviewComment || 'Your post has been removed due to policy violations.'
          );

          // Thông báo cho người report
          await this.notificationHelper.createReportApprovedNotification(
            reporter._id.toString(),
            (post._id as any).toString(),
            this.getReasonDisplayText(report.reason)
          );
        }
        break;

      case ReportStatus.REJECTED:
        // Thông báo cho người report khi bị từ chối
        if (post && reporter) {
          await this.notificationHelper.createReportRejectedNotification(
            reporter._id.toString(),
            (post._id as any).toString(),
            this.getReasonDisplayText(report.reason),
            updateDto.reviewComment
          );
        }
        break;

      case ReportStatus.REVIEWING:
        // Thông báo cho người report khi đang xem xét
        if (post && reporter) {
          await this.notificationHelper.createReportUnderReviewNotification(
            reporter._id.toString(),
            (post._id as any).toString(),
            this.getReasonDisplayText(report.reason)
          );
        }
        break;
    }

    // Cập nhật report
    const updatedReport = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        ...updateDto,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
      { new: true }
    ).exec();

    if (!updatedReport) {
      throw new NotFoundException('Report not found');
    }

    return updatedReport;
  }

  /**
   * Lấy chi tiết report
   */
  async getReportById(reportId: string): Promise<Report> {
    const report = await this.reportModel.findById(reportId)
      .populate('postId')
      .populate('reporterId', 'fullName email avatar')
      .populate('reviewedBy', 'fullName email')
      .exec();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Lấy reports của user (cho user xem reports mình đã tạo)
   */
  async getUserReports(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find({ reporterId: userId })
        .populate('postId', 'caption imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments({ reporterId: userId }).exec(),
    ]);

    return {
      reports,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
        limit,
      },
    };
  }
  /**
   * Chuyển đổi reason enum thành text hiển thị
   */
  private getReasonDisplayText(reason: string): string {
    const reasonTexts = {
      'inappropriate_content': 'Inappropriate Content',
      'spam': 'Spam',
      'harassment': 'Harassment or Bullying',
      'violence': 'Violence or Dangerous Content',
      'hate_speech': 'Hate Speech',
      'other': 'Other Violation'
    };
    return reasonTexts[reason] || reason;
  }
}
