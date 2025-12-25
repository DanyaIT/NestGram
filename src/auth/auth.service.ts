import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@src/generated/prisma/client';
import { SignInDto } from './dto/signin.dto';
import { CreateUserDto } from '@src/users/dto/user.dto';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(payload: CreateUserDto) {
    await this.userService.createUser(payload);

    return { success: true };
  }

  async signin(payload: SignInDto, req: Request) {
    const { email, password } = payload;
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Пользователя с такими данными не существует');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException(
        'Неверные авторизационные данные, повторите еще раз',
      );
    }

    await new Promise((res, rej) =>
      req.login(user.id, err => (err ? rej(err) : res(true))),
    );
    const sid = req.sessionID;

    return this.generateToken(user, sid);
  }

  private generateToken(user: User, sid: string) {
    const payload = { sub: user.id, sid, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
