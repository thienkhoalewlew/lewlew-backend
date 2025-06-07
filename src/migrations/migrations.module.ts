import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MigrationsController } from './migrations.controller';
import { UpdateUsersTemporaryFieldMigration } from './update-users-temporary-field';
import { UpdateUsersUsernameFieldMigration } from './update-users-username-field';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [MigrationsController],
  providers: [UpdateUsersTemporaryFieldMigration, UpdateUsersUsernameFieldMigration],
})
export class MigrationsModule {}
