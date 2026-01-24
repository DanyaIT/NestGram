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
import { CreateUserDto } from '@src/user/dto/user.dto';
import { SignInDto } from './dto/signin.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { isPublic } from 'src/auth/decorators/public.decorator';
import { SignInResponseDto } from './dto/signin-response.dto';
import { SignUpResponseDto } from './dto/signup-response.dto';
import { ValidateResponseDto } from './dto/validate.response.dto';
import { JwtPayload } from './types/jwt';
import {
  ONE_WEEK_IN_MILLISECONDS,
  THIFTEEN_MINUTES_IN_MILLISECONDS,
} from '@src/shared/consts';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@src/app/types/env-config';

@Controller({ path: 'auth', version: '1' })
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {}

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
    status: HttpStatus.OK,
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
      sameSite: 'lax',
      maxAge: THIFTEEN_MINUTES_IN_MILLISECONDS,
      domain: this.configService.get<string>('DOMAIN'),
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_WEEK_IN_MILLISECONDS,
      domain: this.configService.get<string>('DOMAIN'),
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
      maxAge: THIFTEEN_MINUTES_IN_MILLISECONDS,
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
    await this.authService.logout(req?.user?.sub);
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
