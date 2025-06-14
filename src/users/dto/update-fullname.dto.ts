import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdateFullnameDto {
  @ApiProperty({
    description: "The new full name of the user",
    example: "John Doe",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullname: string;
} 