import { ApiProperty } from '@nestjs/swagger';

export class RedisTestResponseDTO {
  @ApiProperty()
  isWriteSuccess: boolean;
  @ApiProperty()
  isReadSuccess: boolean;
  @ApiProperty()
  isCleanSuccess: boolean;
}
