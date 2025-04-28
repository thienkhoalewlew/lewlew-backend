import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Login email address',
    example: 'john.smith@example.com',
    required: true
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Login password',
    example: 'password123',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
