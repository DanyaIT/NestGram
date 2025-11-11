import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma';
import type { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  findAll() {
    return `This action returns all users`;
  }

  findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
