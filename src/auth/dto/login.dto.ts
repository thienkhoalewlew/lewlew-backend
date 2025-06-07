import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Phone number or username',
    example: '+84901234567',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  login: string; // Can be phone number or username

  @ApiProperty({
    description: 'Login password',
    example: 'password123',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
