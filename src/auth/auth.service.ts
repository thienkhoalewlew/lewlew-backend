import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Omit<UserDocument, 'password'>; token: string }> {
    const { email, password, fullName, avatar } = registerDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email has been used');
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique username from email
    let baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    
    // Check if username already exists and add number suffix if needed
    while (await this.userModel.findOne({ username }).exec()) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const newUser = new this.userModel({
      email,
      username,
      password: hashedPassword,
      fullName,
      avatar,
      location: {
        type: 'Point',
        coordinates: [0, 0],
      },
      friends: [],
      friendRequests: [],
      settings: {
        notificationRadius: 5,
        pushNotification: true,
        emailNotification: true,
      },
      lastActive: new Date(),
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = this.generateToken(savedUser);

    // Trả về thông tin user và token không bao gồm password
    const userResponse = savedUser.toObject();
    delete (userResponse as any).password;

    return {
      user: userResponse,
      token,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Omit<UserDocument, 'password'>; token: string }> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email }).select('+password').exec();
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Update last active time
    user.lastActive = new Date();
    await user.save();

    const token = this.generateToken(user);

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return {
      user: userResponse,
      token,
    };
  }

  async validateUser(userId: string): Promise<User> {
    console.log('Validating user with ID:', userId);
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        console.error('User not found with ID:', userId);
        throw new UnauthorizedException('User does not exist');
      }
      console.log('User found successfully:', userId);
      return user;
    } catch (error) {
      console.error('Error validating user:', error.message);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authentication');
    }
  }

  private generateToken(user: UserDocument): string {
    const payload = { sub: user._id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
