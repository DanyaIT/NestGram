import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SignUpResponseDto {
  @ApiProperty({
    description: 'Status',
    example: true,
  })
  @IsBoolean()
  success: boolean;
}
