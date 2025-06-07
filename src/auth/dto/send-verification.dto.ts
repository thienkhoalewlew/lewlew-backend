import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationDto {
  @ApiProperty({
    description: 'Phone number to send verification code',
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
