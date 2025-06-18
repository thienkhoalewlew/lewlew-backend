import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Upload, UploadSchema } from '../uploads/schemas/upload.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';
import { SocketModule } from '../socket/socket.module';
import { PostsModule } from '../posts/posts.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Upload.name, schema: UploadSchema },
      { name: Notification.name, schema: NotificationSchema },    ]),
    SocketModule,
    PostsModule,
    LikesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, NotificationHelperService, NotificationsService, UploadsService],
  exports: [AdminService],
})
export class AdminModule {}
