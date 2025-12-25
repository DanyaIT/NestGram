import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ValidateResponseDto {
  @ApiProperty({
    description: 'Status of auth',
    example: true,
  })
  @IsBoolean()
  success: boolean;
}
