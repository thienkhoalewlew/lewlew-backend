import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FriendRequestResponse {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export class RespondFriendRequestDto {
  @ApiProperty({
    description: 'Response to friend request (accept/reject)',
    enum: FriendRequestResponse,
    example: FriendRequestResponse.ACCEPT,
    required: true,
  })
  @IsNotEmpty({ message: 'Response cannot be blank' })
  @IsEnum(FriendRequestResponse, {
    message: 'Response must be accept or reject'
  })
  response: FriendRequestResponse;
}
