import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsEnum } from "class-validator";

export class CreateNotificationDto {
    @ApiProperty({
        description: "ID of the notification recipient",
        example: "1234567890abcdef"
    })
    @IsString()
    @IsNotEmpty()
    recipientId: string;

    @ApiProperty({
        description: "ID of the notification sender",
        example: "abcdef1234567890"
    })
    @IsOptional()
    @IsString()
    senderId?: string;    @ApiProperty({
        description: "Type of the notification",
        example: "message",
        enum: ['like', 'comment', 'friend_request', 'friend_accept', 'nearby_post', 'friend_post']
    })
    @IsNotEmpty()
    @IsEnum(['like', 'comment', 'friend_request', 'friend_accept', 'nearby_post', 'friend_post'])
    type: string;

    @ApiProperty({
        description: "ID of the post related to the notification",
        example: "1234567890abcdef",
        required: false
    })
    @IsOptional()
    @IsString()
    postId?: string;

    @ApiProperty({
        description:" ID of the comment related to the notification",
        example: "abcdef1234567890",
        required: false
    })
    @IsOptional()
    @IsString()
    commentId?: string;

    @ApiProperty({
        description: "Message of the notification",
        example: "You have a new friend request",
        required: false
    })
    @IsNotEmpty()
    @IsString()
    message: string;
}