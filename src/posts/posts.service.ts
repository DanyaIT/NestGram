import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
// import { CreatePostDto } from './dto/create-post.dto';
// import { UpdatePostDto } from './dto/update-post.dto';
// import { Post } from './entities/post.entity';

const url = 'https://jsonplaceholder.typicode.com';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // create(createPostDto: CreatePostDto) {
  //   return 'This action adds a new post';
  // }
  //
  async findAll() {
    return this.prisma.user.findMany();
    // try {
    //   const res = await fetch(`${url}/posts`);
    //   return res.json();
    // } catch (error) {
    //   console.log(error);
    // }
  }

  async findOne(id: number) {
    try {
      const res = await fetch(`${url}/posts/${id}`);
      return res.json();
    } catch (error) {
      console.log(error);
    }
  }
  //
  // update(id: number, updatePostDto: UpdatePostDto) {
  //   return `This action updates a #${id} post`;
  // }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
