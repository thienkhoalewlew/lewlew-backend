import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class UpdateUsersUsernameFieldMigration {
  private readonly logger = new Logger(UpdateUsersUsernameFieldMigration.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Starting migration: Update users username field');

    try {
      // Find all users that don't have username or have empty username
      const usersWithoutUsername = await this.userModel.find({
        $or: [
          { username: { $exists: false } },
          { username: '' },
          { username: null }
        ]
      });

      this.logger.log(`Found ${usersWithoutUsername.length} users without username`);

      let updatedCount = 0;

      for (const user of usersWithoutUsername) {
        try {
          // Generate username from phone number or fullName
          let generatedUsername = '';
          
          if (user.phoneNumber) {
            // Use last 8 digits of phone number
            const phoneDigits = user.phoneNumber.replace(/\D/g, '');
            generatedUsername = `user_${phoneDigits.slice(-8)}`;
          } else if (user.fullName) {
            // Use fullName with underscores and add random number
            const cleanName = user.fullName
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '');
            const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
            generatedUsername = `${cleanName}_${randomNum}`;          } else {
            // Fallback to user ID
            generatedUsername = `user_${(user._id as any).toString().slice(-8)}`;
          }

          // Check if username already exists and make it unique
          let finalUsername = generatedUsername;
          let counter = 1;
          
          while (await this.userModel.findOne({ username: finalUsername })) {
            finalUsername = `${generatedUsername}_${counter}`;
            counter++;
          }          // Update the user with new username
          await this.userModel.updateOne(
            { _id: user._id },
            { $set: { username: finalUsername } }
          );

          updatedCount++;
          this.logger.log(`Updated user ${(user._id as any).toString()} with username: ${finalUsername}`);
        } catch (error) {
          this.logger.error(`Failed to update user ${(user._id as any).toString()}:`, error);
        }
      }

      this.logger.log(`Migration completed: Updated ${updatedCount} users with usernames`);
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }
}
