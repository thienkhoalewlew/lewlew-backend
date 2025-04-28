import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FriendrelationsModule } from './friendrelations/friendrelations.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { UploadsModule } from './uploads/uploads.module';
import { UploadsService } from './uploads/uploads.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/lewlew-db', {
      // Các tùy chọn kết nối
      serverSelectionTimeoutMS: 5000, // Timeout sau 5 giây nếu không kết nối được
      retryWrites: true,
      connectTimeoutMS: 10000, // Tăng thời gian timeout kết nối
    }),
    UsersModule,
    FriendrelationsModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    UploadsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, UploadsService],
})
export class AppModule {}
