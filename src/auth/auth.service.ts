import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@src/user/user.service';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/signin.dto';
import { CreateUserDto } from '@src/user/dto/create-user-request.dto';
import { RedisService } from '@src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './types/jwt';
import {
  ONE_WEEK_IN_MILLISECONDS,
  THIFTEEN_MINUTES_IN_MILLISECONDS,
} from '@src/shared/consts';
import { User } from 'prisma/generated/client';

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>('JWT_SECRET');
  }

  async signup(payload: CreateUserDto) {
    await this.userService.createUser(payload);

    return { success: true };
  }

  async signin(payload: SignInDto) {
    const { email, password } = payload;
    const user = await this.userService.getUser({ email });

    if (!user) {
      throw new UnauthorizedException('Пользователя с такими данными не существует');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException(
        'Неверные авторизационные данные, повторите еще раз',
      );
    }

    const accessSid = crypto.randomUUID();
    await this.redisService.setJson(
      `session:${user.id}`,
      accessSid,
      THIFTEEN_MINUTES_IN_MILLISECONDS,
    );

    const refreshSid = crypto.randomUUID();
    await this.redisService.setJson(
      `refresh:${user.id}`,
      refreshSid,
      ONE_WEEK_IN_MILLISECONDS,
    );

    return this.generateTokens(user, accessSid, refreshSid);
  }

  async logout(userId: string) {
    await this.redisService.clear(`session:${userId}`);
    await this.redisService.clear(`refresh:${userId}`);

    return { success: true };
  }

  async refresh(refresh_token: string) {
    const { sid } = this.jwtService.verify<JwtPayload>(refresh_token, {
      secret: this.secret,
    });

    if (!sid) {
      throw new UnauthorizedException('Refresh token is broken');
    }

    const { sub, email } = this.jwtService.verify<JwtPayload>(refresh_token, {
      secret: this.secret,
    });
    const sidFromRedis = await this.redisService.getJson<string>(`refresh:${sub}`);

    if (!sidFromRedis) {
      throw new UnauthorizedException('Refresh token is expired');
    }

    const newSid = crypto.randomUUID();
    await this.redisService.setJson(
      `session:${sub}`,
      newSid,
      THIFTEEN_MINUTES_IN_MILLISECONDS,
    );

    const access_token = this.jwtService.sign(
      {
        sub: sub,
        sid: newSid,
        email: email,
      },
      { secret: this.secret, expiresIn: '15Min' },
    );

    return { access_token };
  }

  private generateTokens(user: User, accessSid: string, refreshSid: string) {
    const secret = this.secret;
    const { id: sub, email } = user;
    const payload = { sub, email };

    return {
      access_token: this.jwtService.sign(
        { ...payload, sid: accessSid },
        {
          secret,
          expiresIn: '15Min',
        },
      ),
      refresh_token: this.jwtService.sign(
        { ...payload, sid: refreshSid },
        {
          secret,
          expiresIn: '7d',
        },
      ),
    };
  }
}
