import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLoggerMiddleware } from './app.logger.middleware';
import { BucketModule } from '@src/bucket/bucket.module';
import { PostsModule } from '@src/posts/posts.module';
import { PrismaModule } from '@src/prisma';
import { UsersModule } from '@src/users/users.module';
import { AuthModule } from '@src/auth/auth.module';
import { FileModule } from '@src/file/file.module';
import * as Joi from 'joi';
import { RedisModule } from '@src/redis/redis.module';

const requiredString = Joi.string().required();

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
      validationSchema: Joi.object({
        S3_BUCKET_NAME: requiredString,
        POSTGRES_URI: requiredString,
        S3_REGION: requiredString,
        S3_HOST: requiredString,
        S3_KEY: requiredString,
        S3_SECRET: requiredString,
        JWT_SECRET: requiredString,
      }),
    }),
    AuthModule,
    RedisModule,
    UsersModule,
    FileModule,
    PrismaModule,
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
