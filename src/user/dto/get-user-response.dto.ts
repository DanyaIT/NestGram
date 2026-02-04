import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'prisma/generated/enums';

export class GetUserResponseDto {
  @ApiProperty({
    description: 'User id',
  })
  @IsString()
  sub: string;

  @ApiProperty({
    description: "User's email address",
    example: 'danilka@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'Danilka',
  })
  @IsString()
  username: string;
  @ApiProperty({
    description: 'Role',
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
