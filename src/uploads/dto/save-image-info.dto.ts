import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject } from 'class-validator';

export class SaveImageInfoDto {
  @ApiProperty({
    description: 'Cloudinary URL of the image',
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Filename on Cloudinary',
    example: 'sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'my-image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  originalname: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 123456,
  })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty({
    description: 'Additional metadata',
    example: { width: 800, height: 600 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}