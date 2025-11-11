import { ApiProperty } from '@nestjs/swagger';

export class CacheTestResponseDoto {
  @ApiProperty()
  isWriteSuccess: boolean;
  @ApiProperty()
  isReadSuccess: boolean;
  @ApiProperty()
  isCleanSuccess: boolean;
}
