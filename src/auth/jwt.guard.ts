import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from './decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@src/redis/redis.service';
import { JwtPayload } from './types/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const token = req.cookies?.access_token as string;

    if (!token) {
      throw new UnauthorizedException('Access denied');
    }

    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const sidFromRedis = await this.redisService.getJson<string>(
      `session:${payload.sub}`,
    );

    if (!sidFromRedis) {
      throw new UnauthorizedException('Session expired');
    }

    if (sidFromRedis !== payload.sid) {
      throw new UnauthorizedException('Session midmatch');
    }

    req.user = payload;

    return true;
  }
}
