import { Controller, Param, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller({ path: 'users', version: '1' })
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
