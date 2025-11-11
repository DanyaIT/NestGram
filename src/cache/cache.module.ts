import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule as NestjsCaheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { NodeEnv } from '../constants/node-env.enum';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
  controllers: [CacheController],
  imports: [
    NestjsCaheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const currentEnv = configService.get<NodeEnv>('NODE_ENV');
        const redisUrl = configService.get('REDIS_URL');
        const redisPassword = configService.get('REDIS_PASSWORD');

        if (currentEnv === NodeEnv.TEST || !redisUrl) {
          const logger = new Logger(NestjsCaheModule.name);
          logger.warn('env.REDIS_URL is not set OR it is "test" environment. Memory cache will be used.');
          return {
            store: 'memory',
          };
        }

        return {
          store: await redisStore({
            url: redisUrl,
            password: redisPassword,
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class CacheModule {}
