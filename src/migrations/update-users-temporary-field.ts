import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class UpdateUsersTemporaryFieldMigration {
  private readonly logger = new Logger(UpdateUsersTemporaryFieldMigration.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Starting migration: Update users isTemporary field');

    try {
      // Update all users that don't have isTemporary field
      const result = await this.userModel.updateMany(
        { isTemporary: { $exists: false } },
        { $set: { isTemporary: false } }
      );

      this.logger.log(`Migration completed: Updated ${result.modifiedCount} users`);
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }
}
