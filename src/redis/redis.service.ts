import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  constructor(@Inject('REDIS') private readonly redisClient: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redisClient.quit();
  }

  async getJson<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const result = await this.redisClient.get(key);

    if (typeof result !== 'string') {
      return null;
    }

    try {
      return JSON.parse(result) as T;
    } catch (error) {
      console.error(error, 'error in cache');
      console.error(result, '<----- invalid value unable to parse');
      return null;
    }
  }

  async setJson<T = Record<string, unknown>>(
    key: string,
    value: T,
    expireMs = 84600_000,
  ): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value), 'EX', expireMs);
  }

  async clear(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
