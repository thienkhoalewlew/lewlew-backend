import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({
    description: 'Geographic data type (GeoJSON)',
    example: 'Point',
    default: 'Point',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  type: string = 'Point';

  @ApiProperty({
    description: 'Coordinates [longitude, latitude]',
    example: [-73.9857, 40.7484],
    required: true
  })
  @IsArray()
  @IsNotEmpty()
  coordinates: number[];

  @ApiProperty({
    description: 'Location name',
    example: 'New York, USA',
    required: false
  })
  @IsString()
  @IsOptional()
  placeName?: string;
}

export class CreatePostDto {
  @ApiProperty({
    description: 'Image URL or base64 string',
    example: 'https://example.com/images/post123.jpg',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Post caption or description',
    example: 'Beautiful day in New York!',
    required: false
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    description: 'Post location',
    type: LocationDto,
    required: true,
    example: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484],
      placeName: 'New York, USA'
    }
  })
  @IsObject()
  @IsNotEmpty()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'Post expiration time (default is 24h after creation)',
    example: '2025-04-12T02:51:56+07:00',
    required: false
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;
}
