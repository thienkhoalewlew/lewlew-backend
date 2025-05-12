import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdatePasswordDto {
  @ApiProperty({
    description: "The current password of the user",
    example: "currentPassword123",
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: "The new password of the user",
    example: "newPassword123",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}