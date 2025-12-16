import { Controller, Post, Body } from '@nestjs/common';
import { PostsService } from './posts.service';
import { ApiTags } from '@nestjs/swagger';
import { CreatePostRequestDto } from './dto/create-post-requiest.dto';
import { User } from '@src/auth/decorators/user.decorator';

@Controller({ path: 'post', version: '1' })
@ApiTags('Post')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostRequestDto, @User('sub') userId: string) {
    return this.postsService.create(createPostDto, userId);
  }
}
