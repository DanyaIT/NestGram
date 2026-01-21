import {
  Body,
  Controller,
  HttpStatus,
  Get,
  Post,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@src/users/dto/user.dto';
import { SignInDto } from './dto/signin.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { isPublic } from 'src/auth/decorators/public.decorator';
import { SignInResponseDto } from './dto/signin-response.dto';
import { SignUpResponseDto } from './dto/signup-response.dto';
import { ValidateResponseDto } from './dto/validate.response.dto';
import { JwtPayload } from './types/jwt';
import { ONE_HOUR_IN_MILLISECONDS } from '@src/shared/consts';

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
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SignInDto,
  ): Promise<SignInResponseDto> {
    const { access_token, refresh_token } = await this.authService.signin(dto);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: ONE_HOUR_IN_MILLISECONDS,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: ONE_HOUR_IN_MILLISECONDS * 7,
    });

    return { success: true };
  }

  @isPublic()
  @Post('refresh')
  @ApiResponse({
    status: HttpStatus.OK,
    type: ValidateResponseDto,
  })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refresh_token = req.cookies?.['refresh_token'] as string;

    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { access_token } = await this.authService.refresh(refresh_token);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_HOUR_IN_MILLISECONDS,
    });
  }

  @Post('logout')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SignInResponseDto,
  })
  async logout(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req?.user) {
      return { success: true };
    }

    await this.authService.logout(req.user.sub);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

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
