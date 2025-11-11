import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLoggerMiddleware } from './app.logger.middleware';
import { CacheModule } from '@src/cache/cache.module';
import { BucketModule } from '@src/bucket/bucket.module';
import { PostsModule } from '@src/posts/posts.module';
import { PrismaModule } from '@src/prisma';
import { SentryModule } from '@src/sentry/sentry.module';
import { UsersModule } from '@src/users/users.module';
import { AuthModule } from '@src/auth/auth.module';
import { FileModule } from '@src/file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AuthModule,
    UsersModule,
    FileModule,
    PrismaModule,
    CacheModule,
    SentryModule,
    PostsModule,
    BucketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
