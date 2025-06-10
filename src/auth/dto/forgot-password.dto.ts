import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendForgotPasswordCodeDto {
  @ApiProperty({
    description: 'Phone number for password reset',
    example: '+84901234567',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+84|0)[3-9][0-9]{8}$/, {
    message: 'Phone number must be a valid Vietnamese phone number'
  })
  phoneNumber: string;
}

export class VerifyForgotPasswordCodeDto {
  @ApiProperty({
    description: 'Phone number for password reset',
    example: '+84901234567',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Verification code received via SMS',
    example: '123456',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Phone number for password reset',
    example: '+84901234567',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Verification code received via SMS',
    example: '123456',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'newPassword123',
    required: true,
    minLength: 8
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
