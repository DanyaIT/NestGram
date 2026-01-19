import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { CreatePostRequestDto } from './dto/create-post-requiest.dto';
import { Post } from 'prisma/generated/client';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostRequestDto, userId: string): Promise<Post> {
    const res = await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
      },
    });

    return res;
  }
}
