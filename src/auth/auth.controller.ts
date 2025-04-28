import { Controller, Get, Post, Req, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ 
    status: 201, 
    description: 'Registration successful',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b1',
        fullName: 'John Smith',
        email: 'john.smith@example.com',
        avatar: 'https://example.com/avatar.jpg',
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
  @ApiOperation({ summary: 'Login to the system' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        id: '6571a2d3e87cf87df032a9b1',
        email: 'john.smith@example.com',
        fullName: 'John Smith',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
      email: req.user.email,
      message: 'Token is valid' 
    };
  }
}
