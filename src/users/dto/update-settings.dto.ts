import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsEnum } from "class-validator";

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

    @ApiProperty({
        description: "User interface language",
        example: "en",
        enum: ["en", "vi"],
        required: false
    })
    @IsOptional()
    @IsEnum(["en", "vi"])
    language?: "en" | "vi";
}