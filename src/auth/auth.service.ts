import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SmsService } from './services/sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Omit<UserDocument, 'password'>; token: string }> {
    const { phoneNumber, password, fullName, avatar, username } = registerDto;

    // Check for existing username
    const existingUsername = await this.userModel.findOne({ 
      username,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (existingUsername) {
      throw new ConflictException('Username has been taken');
    }

    // Check for existing registered user (not temporary)
    const existingUser = await this.userModel.findOne({ 
      phoneNumber,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (existingUser) {
      throw new ConflictException('Phone number has been used');
    }

    // Find and update temporary record or create new user
    let user = await this.userModel.findOne({ 
      phoneNumber,
      isTemporary: true
    }).exec();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Update existing temporary record
      user.username = username;
      user.password = hashedPassword;
      user.fullName = fullName;
      user.avatar = avatar || '';
      user.isTemporary = false;
      user.location = {
        type: 'Point',
        coordinates: [0, 0],
      };
      user.friends = [];
      user.friendRequests = [];
      user.settings = {
        notificationRadius: 5,
        language: 'vi'
      };
      user.lastActive = new Date();
      
      user = await user.save();
    } 
    else {
      // Create completely new user
      const newUser = new this.userModel({
        phoneNumber,
        username,
        password: hashedPassword,
        fullName,
        avatar: avatar || '',
        isTemporary: false,
        location: {
          type: 'Point',
          coordinates: [0, 0],
        },
        friends: [],
        friendRequests: [],
        settings: {
          notificationRadius: 5,
          language: 'vi'
        },
        lastActive: new Date(),
      });

      user = await newUser.save();
    }
    // Generate JWT token
    const token = this.generateToken(user);

    // Trả về thông tin user và token không bao gồm password
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return {
      user: userResponse,
      token,
    };
  }
  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Omit<UserDocument, 'password'>; token: string }> {
    const { login, password } = loginDto;
    
    // Find user by phone number or username (exclude temporary users)
    const user = await this.userModel.findOne({
      $or: [
        { phoneNumber: login },
        { username: login }
      ],
      $and: [
        {
          $or: [
            { isTemporary: { $exists: false } },
            { isTemporary: false }
          ]
        }
      ]
    }).select('+password').exec();
    
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
      const user = await this.userModel.findOne({
        _id: userId,
        $or: [
          { isTemporary: { $exists: false } },
          { isTemporary: false }
        ]
      }).exec();
      
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
    const payload = { sub: user._id, phoneNumber: user.phoneNumber };
    return this.jwtService.sign(payload);
  }
  
  async sendVerificationCode(sendVerificationDto: SendVerificationDto): Promise<{ message: string }> {
    const { phoneNumber } = sendVerificationDto;
    // Check if phone number already exists as a registered user (not temporary)
    const existingUser = await this.userModel.findOne({ 
      phoneNumber,
      $or: [
        { isTemporary: { $exists: false } },
        { isTemporary: false }
      ]
    }).exec();
    
    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    // Generate verification code
    const code = this.smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code temporarily
    await this.userModel.findOneAndUpdate(
      { phoneNumber },
      {
        phoneNumber,
        verificationCode: code,
        verificationCodeExpires: expiresAt,
        phoneVerified: false,
        isTemporary: true,
      },
      { upsert: true, new: true }
    );

    // Send SMS
    const smsSent = await this.smsService.sendVerificationCode(phoneNumber, code);
    
    if (!smsSent) {
      throw new BadRequestException('Failed to send verification code');
    }

    // Log code trong development mode
    const smsMode = this.smsService.getServiceMode();
    if (smsMode.isDevelopment) {
      this.logger.warn(`🔧 DEVELOPMENT MODE: Verification code for ${phoneNumber} is: ${code}`);
      this.logger.warn(`📝 Use this code in your mobile app to complete verification`);
    }

    return { message: 'Verification code sent successfully' };
  }
  
  async verifyCode(verifyCodeDto: VerifyCodeDto): Promise<{ message: string }> {
    const { phoneNumber, code } = verifyCodeDto;

    // Find the temporary user record
    const user = await this.userModel.findOne({ 
      phoneNumber,
      isTemporary: true 
    }).exec();
    
    if (!user) {
      throw new BadRequestException('Invalid phone number or verification session expired');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    // Mark phone as verified and clear verification code
    await this.userModel.findByIdAndUpdate(user._id, {
      phoneVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    return { message: 'Phone number verified successfully' };
  }
}
