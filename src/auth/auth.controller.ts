import { Body, Controller, HttpStatus, Get, Post, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@src/users/dto/user.dto';
import { SignInDto } from './dto/signin.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { isPublic } from 'src/auth/decorators/public.decorator';
import { SignInResponseDto } from './dto/signin-response.dto';
import { SignUpResponseDto } from './dto/signup-response.dto';
import { ValidateResponseDto } from './dto/validate.response.dto';

@Controller({ path: 'auth', version: '1' })
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @isPublic()
  @Post('signup')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SignUpResponseDto,
  })
  async signup(@Body() dto: CreateUserDto) {
    return this.authService.signup(dto);
  }

  @isPublic()
  @Post('signin')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SignInResponseDto,
  })
  async signin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SignInDto,
  ): Promise<SignInResponseDto> {
    const { access_token } = await this.authService.signin(dto, req);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { success: true };
  }

  @Get('validate')
  @ApiResponse({
    status: HttpStatus.OK,
    type: ValidateResponseDto,
  })
  validate() {
    return { success: true };
  }
}
