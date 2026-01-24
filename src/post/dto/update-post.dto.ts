import { PartialType } from '@nestjs/swagger';
import { CreatePostRequestDto } from './create-post-requiest.dto';

export class UpdatePostDto extends PartialType(CreatePostRequestDto) {}
