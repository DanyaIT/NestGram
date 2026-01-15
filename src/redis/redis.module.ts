import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS',
      useFactory: () => {
        return new Redis({});
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
