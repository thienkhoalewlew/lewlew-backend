import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFriendRequestDto {
  @ApiProperty({
    description: 'ID of the user to send friend request to',
    example: '6571a2d3e87cf87df032a9b2',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  receiverId: string;
}
