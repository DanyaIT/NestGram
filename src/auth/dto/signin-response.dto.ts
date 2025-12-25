import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SignInResponseDto {
  @ApiProperty({
    description: 'Status of auth',
    example: true,
  })
  @IsBoolean()
  success: boolean;
}
