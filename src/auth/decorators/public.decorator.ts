import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

export const isPublic = () => SetMetadata(IS_PUBLIC, true);
