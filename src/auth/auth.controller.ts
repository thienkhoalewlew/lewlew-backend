import { Controller, Get, Post, Req, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SendForgotPasswordCodeDto, VerifyForgotPasswordCodeDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SmsService } from './services/sms.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly smsService: SmsService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })  @ApiResponse({ 
    status: 201, 
    description: 'Registration successful',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b1',
        fullName: 'John Smith',
        phoneNumber: '+84901234567',
        avatar: null,
        createdAt: '2025-04-11T02:51:56+07:00',
        updatedAt: '2025-04-11T02:51:56+07:00',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @Post('login')
  @ApiOperation({ summary: 'Login to the system' })  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b1',
        phoneNumber: '+84901234567',
        fullName: 'John Smith',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })  @ApiResponse({ status: 401, description: 'Invalid phone number or password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login to the system' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin login successful',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b1',
        phoneNumber: '+84901234567',
        fullName: 'Admin User',
        isAdmin: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or not an admin' })
  adminLogin(@Body() loginDto: LoginDto) {
    return this.authService.adminLogin(loginDto);
  }

  @Post('send-verification')
  @ApiOperation({ summary: 'Send verification code to phone number' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  sendVerificationCode(@Body() sendVerificationDto: SendVerificationDto) {
    return this.authService.sendVerificationCode(sendVerificationDto);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Verify phone number with code' })
  @ApiResponse({ status: 200, description: 'Phone number verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyCodeDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify if token is valid' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  verifyToken(@Req() req: Request & { user: UserDocument }) {
    return { 
      valid: true, 
      userId: req.user._id,
      phoneNumber: req.user.phoneNumber,
      message: 'Token is valid' 
    };
  }

  // Forgot Password endpoints
  @Post('forgot-password/send-code')
  @ApiOperation({ summary: 'Send verification code for password reset' })
  @ApiResponse({ status: 200, description: 'Password reset code sent successfully' })
  @ApiResponse({ status: 400, description: 'No account found with this phone number' })
  sendForgotPasswordCode(@Body() dto: SendForgotPasswordCodeDto) {
    return this.authService.sendForgotPasswordCode(dto);
  }

  @Post('forgot-password/verify-code')
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Verification code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  verifyForgotPasswordCode(@Body() dto: VerifyForgotPasswordCodeDto) {
    return this.authService.verifyForgotPasswordCode(dto);
  }

  @Post('forgot-password/reset')
  @ApiOperation({ summary: 'Reset password with verified code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
