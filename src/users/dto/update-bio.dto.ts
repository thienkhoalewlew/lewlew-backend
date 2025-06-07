import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength } from "class-validator";

export class UpdateBioDto {
  @ApiProperty({
    description: "The user's bio",
    example: "Hello, I'm a photographer who loves to travel",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bio: string;
} 