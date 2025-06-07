import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username (unique identifier)',
    example: 'johnsmith123',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscores'
  })
  username: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Smith',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Phone number (Vietnamese format)',
    example: '+84901234567',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+84|0)[3-9][0-9]{8}$/, {
    message: 'Phone number must be a valid Vietnamese phone number'
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'password123',
    required: true,
    minLength: 8
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
