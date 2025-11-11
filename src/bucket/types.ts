export interface BucketUploadedFile {
  file: Express.Multer.File;
  isPublic: boolean;
}

export interface BucketUploadedFileReturn {
  key: string;
  url: string;
}
