import { IsOptional, IsString, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @ApiProperty({
    description: 'Search query for user full name, username, or phone number',
    example: 'john',
    required: false
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of results per page',
    example: 10,
    required: false,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
