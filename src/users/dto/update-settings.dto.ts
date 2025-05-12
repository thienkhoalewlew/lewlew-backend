import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class UpdateSettingsDto {
    @ApiProperty({
        description: "Notification radius (km)",
        example: 10,
        required: false
    })
    @IsOptional()
    @IsNumber()
    notificationRadius?: number;

    @ApiProperty({
        description: "Enable/disable push notifications",
        example: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    pushNotifications?: boolean;

    @ApiProperty({
        description: "Enable/disable email notifications",
        example: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    emailNotifications?: boolean;
}