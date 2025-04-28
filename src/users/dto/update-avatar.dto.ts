import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'URL of the new avatar' })
  @IsString()
  @IsNotEmpty()
  avatar: string;
}
