import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsEnum } from "class-validator";

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
        description: "User interface language",
        example: "en",
        enum: ["en", "vi"],
        required: false
    })
    @IsOptional()
    @IsEnum(["en", "vi"])
    language?: "en" | "vi";
}