import { IsString, IsMongoId } from 'class-validator';

export class CreateLikeDto {
  @IsString()
  @IsMongoId()
  postId: string;
}
