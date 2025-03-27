import { Module } from '@nestjs/common';
import { FriendrelationsController } from './friendrelations.controller';
import { FriendrelationsService } from './friendrelations.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FriendRelation,
  FriendRelationSchema,
} from './schemas/friendrelation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRelation.name, schema: FriendRelationSchema },
    ]),
  ],
  controllers: [FriendrelationsController],
  providers: [FriendrelationsService],
  exports: [FriendrelationsService],
})
export class FriendrelationsModule {}
