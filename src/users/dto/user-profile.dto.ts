import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '6571a2d3e87cf87df032a9b1' })
  _id: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  profileImage?: string;

  @ApiProperty({ example: 'Hello, I am John!', required: false })
  bio?: string;

  @ApiProperty({ example: 5 })
  postCount: number;

  @ApiProperty({ example: 12 })
  friendCount: number;
}