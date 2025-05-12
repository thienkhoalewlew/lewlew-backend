import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdateUsernameDto {
  @ApiProperty({
    description: "The new username of the user",
    example: "newUsername123",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;
}