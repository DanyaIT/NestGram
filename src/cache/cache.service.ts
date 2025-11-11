import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class CacheService implements OnApplicationShutdown {
  constructor(@Inject('CACHE_MANAGER') private readonly cacheClient: Cache) {}

  async onApplicationShutdown(): Promise<void> {
    // закрываем кэш при завершении приложения - необходимо для того чтобы Jest не зависал
    await this.cacheClient.reset();
  }

  async getJson<T = Record<string, any>>(key: string): Promise<T | null> {
    const result = await this.cacheClient.get(key);

    if (!result) {
      return null;
    }
    try {
      return JSON.parse(result as string);
    } catch (error) {
      console.log(error, 'error in cache');
      console.log(result, '<----- invalid value unable to parse');
      return null;
    }
  }

  async setJson<T = Record<string, any>>(key: string, value: T, expireMs = 84600_000): Promise<void> {
    await this.cacheClient.set(key, JSON.stringify(value), expireMs);
  }

  async clear(key: string): Promise<void> {
    await this.cacheClient.del(key);
  }
}
