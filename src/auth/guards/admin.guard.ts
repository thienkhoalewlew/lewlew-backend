import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // JWT Strategy returns { userId, phoneNumber }, so we use userId instead of sub
    const userId = user.userId || user.sub;
    
    if (!userId) {
      throw new ForbiddenException('Invalid user token');
    }

    // Lấy thông tin user từ database để kiểm tra isAdmin
    const fullUser = await this.userModel.findById(userId).exec();
    
    if (!fullUser || !fullUser.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    // Add full user data to request for later use
    request.adminUser = fullUser;

    return true;
  }
}
