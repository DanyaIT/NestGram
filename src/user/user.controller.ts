import { Controller, Param, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from '@src/auth/decorators/user.decorator';
import { GetUserResponseDto } from './dto/get-user-response.dto';

@Controller({ path: 'users', version: '1' })
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetUserResponseDto,
  })
  @Get('/me')
  async getUser(@User('sub') userId: string) {
    return await this.userService.getMe(userId);
  }

  @ApiOperation({
    summary: 'Getting posts by user',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'user id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @Get(':userId/posts')
  async getPosts(@Param('userId') userId: string) {
    return await this.userService.getPosts(userId);
  }
}
