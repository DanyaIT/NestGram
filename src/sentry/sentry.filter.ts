import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (!(exception instanceof HttpException) || (exception as HttpException).getStatus() >= 500) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
