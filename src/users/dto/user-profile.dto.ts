import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserProfileDto {
  @ApiProperty({
    example: '1234567890abcdef',
  })
  _id: string;

  @ApiProperty({
    example: 'john_doe',
  })
  fullname: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
  })
  avatar: string;

  @ApiProperty(({
    example: 'example@example.com',
  }))
  email: string;

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
  })
  fullname: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
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
}