import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export enum UpdateType {
  AVATAR = 'avatar',
  PASSWORD = 'password',
  FULLNAME = 'fullname',
  USERNAME = 'username',
  BIO = 'bio',
  SETTINGS = 'settings',
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Type of update to perform',
    enum: UpdateType,
    example: UpdateType.FULLNAME,
  })
  @IsEnum(UpdateType)
  @IsNotEmpty()
  updateType: UpdateType;

  // Avatar fields
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    description: 'URL of the new avatar',
    required: false
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  // Password fields
  @ApiProperty({
    description: "The current password of the user",
    example: "currentPassword123",
    required: false
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({
    description: "The new password of the user",
    example: "newPassword123",
    required: false
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  newPassword?: string;

  // Fullname fields
  @ApiProperty({
    description: "The new full name of the user",
    example: "John Doe",
    required: false
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  fullname?: string;

  // Username fields
  @ApiProperty({
    description: "The new username of the user",
    example: "newUsername123",
    required: false
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  // Bio fields
  @ApiProperty({
    description: "The user's bio",
    example: "Hello, I'm a photographer who loves to travel",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bio?: string;

  // Settings fields
  @ApiProperty({
    description: "Notification radius (km)",
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  notificationRadius?: number;

  @ApiProperty({
    description: "User interface language",
    example: "en",
    enum: ["en", "vi"],
    required: false
  })
  @IsOptional()
  @IsEnum(["en", "vi"])
  language?: "en" | "vi";
}
