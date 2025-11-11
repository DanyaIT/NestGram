export { FileService } from './file.service';
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { BucketModule } from '@src/bucket/bucket.module';

@Module({
  controllers: [FileController],
  providers: [FileService],
  imports: [BucketModule],
})
export class FileModule {}
