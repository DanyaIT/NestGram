import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BucketUploadedFile, BucketUploadedFileReturn } from './types';
import { EnvConfig } from '@src/app/types/env-config';

@Injectable()
export class BucketService {
  private client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.bucketName = this.configService.get('S3_BUCKET_NAME');
    this.client = new S3Client({
      region: this.configService.get('S3_REGION'),
      endpoint: this.configService.get('S3_HOST'),
      credentials: {
        accessKeyId: this.configService.get('S3_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET'),
      },
    });
  }

  async uploadFile({
    file,
    isPublic,
  }: BucketUploadedFile): Promise<BucketUploadedFileReturn> {
    const key = `${crypto.randomUUID()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        originalName: file.originalname,
      },
    });

    const bucketResult = await this.client.send(command);

    if (bucketResult.$metadata.httpStatusCode !== 200) {
      throw new Error('Error from S3');
    }

    return {
      key,
      url: this.getFileUrl(key),
    };
  }

  getFileUrl(key: string) {
    return `${this.configService.get('S3_HOST')}/${this.bucketName}/${key}`;
  }

  async getFile(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await this.client.send(command);
    } catch (error) {
      console.log(error);
    }
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }
}
