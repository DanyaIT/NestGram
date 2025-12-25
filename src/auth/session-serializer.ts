/* eslint-disable @typescript-eslint/ban-types */
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '@src/users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  serializeUser(userId: string, done: Function) {
    done(null, userId);
  }

  async deserializeUser(id: string, done: Function) {
    try {
      const user = await this.usersService.findOne({ id });
      done(null, user.id);
    } catch (error) {
      done(error, null);
    }
  }
}
