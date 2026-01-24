import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePostRequestDto } from './dto/create-post-requiest.dto';
import { User } from '@src/auth/decorators/user.decorator';
import { PostService } from './post.service';

@Controller({ path: 'posts', version: '1' })
@ApiTags('Posts')
export class PostController {
  constructor(private readonly postsService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostRequestDto, @User('sub') userId: string) {
    return this.postsService.create(createPostDto, userId);
  }
}
