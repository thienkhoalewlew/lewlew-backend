import { Module } from '@nestjs/common';
import { FriendrelationsController } from './friendrelations.controller';
import { FriendrelationsService } from './friendrelations.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FriendRelation,
  FriendRelationSchema,
} from './schemas/friendrelation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRelation.name, schema: FriendRelationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FriendrelationsController],
  providers: [FriendrelationsService],
  exports: [FriendrelationsService],
})
export class FriendrelationsModule {}
