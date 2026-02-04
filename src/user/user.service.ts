import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma';
import type { CreateUserDto } from './dto/create-user-request.dto';
import * as bcrypt from 'bcrypt';
import { PostService } from '@src/post/post.service';

@Injectable()
export class UserService {
  constructor(
    private readonly postService: PostService,
    private readonly prisma: PrismaService,
  ) {}

  async getMe(userId: string) {
    const { username, email, id, role } = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return {
      id,
      email,
      username,
      role,
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const hashed = await bcrypt.hash(password, 11);

    return await this.prisma.user.create({
      data: {
        ...rest,
        password: hashed,
      },
    });
  }

  async getPosts(authorId: string) {
    return await this.postService.getByUser({ authorId });
  }

  async getUser(where: { id: string } | { email: string }) {
    return await this.prisma.user.findUnique({
      where,
    });
  }
}
