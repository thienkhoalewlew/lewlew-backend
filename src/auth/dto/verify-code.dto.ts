import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({
    description: 'Phone number',
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
    description: 'Verification code (6 digits)',
    example: '123456',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;
}
