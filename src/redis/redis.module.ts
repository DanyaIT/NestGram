import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@src/app/types/env-config';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS',
      useFactory: (config: ConfigService<EnvConfig>) => {
        return new Redis({
          password: config.get<string>('REDIS_PASSWORD'),
          username: config.get<string>('REDIS_USERNAME'),
          host: config.get<string>('REDIS_HOST'),
          port: Number(config.get<string>('REDIS_PORT')),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
