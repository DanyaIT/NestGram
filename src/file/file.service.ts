import { Injectable } from '@nestjs/common';
import { BucketService } from '@src/bucket';
import { PrismaService } from '@src/prisma';

@Injectable()
export class FileService {
  constructor(
    private readonly bucketService: BucketService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string, isPublic: boolean, postId?: string) {
    const { url, key } = await this.bucketService.uploadFile({ file, isPublic });

    return await this.prisma.file.create({
      data: {
        key,
        url,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploaderId: userId,
        postId,
        isPublic,
      },
    });
  }
}
