import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationHelperService } from './notification-helper.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    SocketModule,
  ],
  providers: [NotificationsService, NotificationHelperService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationHelperService],
})
export class NotificationsModule {}