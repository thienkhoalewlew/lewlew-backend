import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserProfileDto {
  @ApiProperty({
    example: '1234567890abcdef',
  })
  _id: string;

  @ApiProperty({
    example: 'john_doe',
    required: false,
  })
  username?: string;

  @ApiProperty({
    example: 'John Doe',
  })
  fullname: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/profile.jpg',
  })
  avatar: string;

  @ApiProperty(({
    example: '+84901234567',
  }))
  phoneNumber: string;

  @ApiProperty({
    example: 'Hello, I am John Doe!',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    example: 12
  })
  friendCount: number;
}

export class OtherUserProfileDto {
  @ApiProperty({
    example: '1234567890abcdef',
  })
  _id: string;

  @ApiProperty({
    example: 'john_doe',
    required: false,
  })
  username?: string;

  @ApiProperty({
    example: 'John Doe',
  })
  fullname: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/profile.jpg',
  })
  avatar: string;

  @ApiProperty({
    example: 'Hello, I am John Doe!',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    example: 12,
  })
  friendCount: number;

  @ApiProperty({
    example: 'none',
    required: false,
  })
  friendStatus?: 'none' | 'pending' | 'accept' | 'reject';

  @ApiProperty({
    example: '661f0b6f2e7c3c001f9c9a12',
    required: false,
    description: 'Friend request ID when status is pending'
  })
  requestId?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether the current user is the sender of the friend request'
  })
  isRequestSender?: boolean;
}