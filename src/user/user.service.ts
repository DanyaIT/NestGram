import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma';
import type { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { PostService } from '@src/post/post.service';

@Injectable()
export class UserService {
  constructor(
    private readonly postService: PostService,
    private readonly prisma: PrismaService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const hashed = await bcrypt.hash(password, 11);

    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashed,
      },
    });
  }

  async getPosts(authorId: string) {
    return await this.postService.getByUser({ authorId });
  }

  findOne(where: { id: string } | { email: string }) {
    return this.prisma.user.findUnique({
      where,
    });
  }
}
