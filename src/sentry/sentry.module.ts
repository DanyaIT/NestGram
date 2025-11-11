import { Logger, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryController } from './sentry.controller';
import { SentryFilter } from './sentry.filter';
import { SentryInterceptor } from './sentry.interceptor';
import { NodeEnv } from '../constants/node-env.enum';

@Module({
  controllers: [SentryController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class SentryModule {
  constructor(configService: ConfigService, adapterHost: HttpAdapterHost) {
    const NODE_ENV = configService.get<NodeEnv>('NODE_ENV');
    const SENTRY_DSN = configService.get<string>('SENTRY_DSN');

    if (NODE_ENV === NodeEnv.TEST || !SENTRY_DSN) {
      const logger = new Logger(SentryModule.name);
      logger.warn('env.SENTRY_DSN is not set OR it is "test" environment. Sentry disabled.');
      return;
    }

    const SENTRY_SAMPLE_RATE = configService.get('SENTRY_SAMPLE_RATE');
    const SENTRY_TRACES_SAMPLE_RATE = configService.get('SENTRY_TRACES_SAMPLE_RATE');
    const sampleRate = SENTRY_SAMPLE_RATE ? parseFloat(SENTRY_SAMPLE_RATE) : 1;
    const tracesSampleRate = SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(SENTRY_TRACES_SAMPLE_RATE)
      : NODE_ENV === NodeEnv.DEV
        ? 1
        : 0.05; // default production value

    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.Http({
          tracing: true,
          breadcrumbs: true,
        }),
        // Express tracing enabling
        new Sentry.Integrations.Express({
          // app.getHttpAdapter() returns Express application // according https://docs.nestjs.com/faq/http-adapter
          // app: Express // according https://docs.sentry.io/platforms/node/guides/express/
          app: adapterHost.httpAdapter as any, // .getInstance() -  is not workable
        }),
        nodeProfilingIntegration(),
      ],

      // It is percent of errors (from 0 to 1) which would be sampled by Sentry
      sampleRate,
      // It is percent of traces (from 0 to 1) which would be sampled by Sentry
      tracesSampleRate,
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1,
    });

    adapterHost.httpAdapter.use(Sentry.Handlers.requestHandler());
    adapterHost.httpAdapter.use(Sentry.Handlers.tracingHandler());
  }
}
