import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseBoolPipe,
  ParseFilePipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '@src/auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|svg)' }),
          new MaxFileSizeValidator({
            maxSize: 1000000,
            message: 'File is too large. Max file size is 10MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Req() req,
    @Query('isPublic', new ParseBoolPipe({ optional: true })) isPublic = true,
    @Query('postId') postId?: string,
  ) {
    const userId = req.user.userId;
    return await this.fileService.uploadFile(file, userId, isPublic, postId);
  }
}
