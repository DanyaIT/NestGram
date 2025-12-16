import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostRequestDto {
  @ApiProperty({
    description: 'Post title',
    example: 'My First Blog Post',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Post content',
    example: 'This is the content of my blog post...',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({
    description: 'Whether the post is published',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
