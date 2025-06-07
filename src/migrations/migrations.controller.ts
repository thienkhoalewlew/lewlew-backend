import { Controller, Post } from '@nestjs/common';
import { UpdateUsersTemporaryFieldMigration } from './update-users-temporary-field';
import { UpdateUsersUsernameFieldMigration } from './update-users-username-field';

@Controller('migrations')
export class MigrationsController {
  constructor(
    private readonly updateUsersTemporaryFieldMigration: UpdateUsersTemporaryFieldMigration,
    private readonly updateUsersUsernameFieldMigration: UpdateUsersUsernameFieldMigration,
  ) {}

  @Post('update-users-temporary-field')
  async updateUsersTemporaryField() {
    await this.updateUsersTemporaryFieldMigration.run();
    return { message: 'Migration completed successfully' };
  }

  @Post('update-users-username-field')
  async updateUsersUsernameField() {
    await this.updateUsersUsernameFieldMigration.run();
    return { message: 'Username migration completed successfully' };
  }

  @Post('run-all')
  async runAllMigrations() {
    await this.updateUsersTemporaryFieldMigration.run();
    await this.updateUsersUsernameFieldMigration.run();
    return { message: 'All migrations completed successfully' };
  }
}
