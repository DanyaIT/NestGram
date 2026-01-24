import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { CreatePostRequestDto } from './dto/create-post-requiest.dto';
import { Post } from 'prisma/generated/client';
import { GetPostsByUserRequestDto } from './dto/get-posts-by-user.dto';

@Injectable()
export class PostService {
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

  async getByUser({ authorId }: GetPostsByUserRequestDto): Promise<Post[]> {
    const res = await this.prisma.post.findMany({
      where: {
        authorId,
      },
    });

    return res;
  }
}
