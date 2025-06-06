import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schemas/post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Upload, UploadSchema } from '../uploads/schemas/upload.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Upload.name, schema: UploadSchema },
    ]),
    NotificationsModule,
    UploadsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
