import { ApiProperty } from '@nestjs/swagger';

export class SentryErrorQueryDto {
  @ApiProperty({
    required: false,
    type: Boolean,
  })
  isUserError?: boolean;
}
