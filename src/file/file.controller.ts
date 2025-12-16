import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseBoolPipe,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/auth/decorators/user.decorator';

@Controller({ path: 'file', version: '1' })
@ApiTags('File')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({
    summary: 'Upload file',
    description: 'Upload file with max size 10MB. Formats: PNG, JPEG, JPG, SVG.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File for uploading',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    type: Boolean,
    description: 'Is pulic or not (true/false)',
    example: true,
  })
  @ApiQuery({
    name: 'postId',
    required: false,
    type: String,
    description: 'Id of post',
    example: 'clabc123def456',
  })
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

    @User('sub') userId: string,
    @Query('isPublic', new ParseBoolPipe({ optional: true })) isPublic = true,
    @Query('postId') postId?: string,
  ) {
    return await this.fileService.uploadFile(file, userId, isPublic, postId);
  }
}
