import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetPostsByUserRequestDto {
  @ApiProperty({
    description: 'Get posts by user',
  })
  @IsString()
  authorId: string;
}
