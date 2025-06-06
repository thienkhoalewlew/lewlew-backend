import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'ID of the post being commented on',
    example: '6571a2d3e87cf87df032a9b2',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  postId: string;

  @ApiProperty({
    description: 'Comment text content',
    example: 'Great photo!',
    required: false,
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    description: 'Image URL for comment with image',
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/comment-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string;
}
