import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsBoolean } from "class-validator";

export class UpdateNotificationDto {
    @ApiProperty({
        description: "Read status of the notification",
        example: true,
    })
    @IsNotEmpty()
    @IsBoolean()
    read: boolean;
}