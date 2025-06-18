import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schemas/post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Upload, UploadSchema } from '../uploads/schemas/upload.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Upload.name, schema: UploadSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    NotificationsModule,
    UploadsModule,
    LikesModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
