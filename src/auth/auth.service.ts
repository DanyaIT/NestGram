import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '@src/generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '@src/users/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(payload: CreateUserDto) {
    const user: User = await this.userService.createUser(payload);

    return this.generateToken(user);
  }

  async login(payload: LoginDto) {
    const { email, password } = payload;
    const user = await this.userService.findOne(email);

    if (!user) {
      throw new UnauthorizedException('Пользователя с такими данными не существует');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Неверные авторизационные данные, повторите еще раз');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
