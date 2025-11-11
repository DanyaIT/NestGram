import { Controller, ForbiddenException, Get, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { startSpan } from '@sentry/node';
import { Request } from 'express';
import { SentryErrorQueryDto } from './dto/sentry-error-query.dto';

@ApiTags('sentry-test')
@Controller('sentry-test')
export class SentryController {
  constructor(private readonly configService: ConfigService) {}

  @Get('tracing/:traceLevel')
  async testTracing(@Param('traceLevel') traceLevel: string): Promise<string> {
    console.log(`Trace Level is: ${traceLevel}`);
    const level = Math.max(Math.min(4, parseInt(traceLevel)), 0); // set correct level - from 0 to 4

    if (level) {
      console.log('Do nested request...');
      await startSpan(
        {
          name: 'Just one span with fetching',
          op: 'Test span category',
        },
        async (span) => {
          await fetch(
            `http://localhost:${this.configService.get('PORT') || 3000}/sentry-test/tracing/${level - 1}`,
          ).then((r) => r.text());
          span.end();
        },
      );
    } else {
      console.log('No more levels...');
    }

    await startSpan(
      {
        name: 'Long async operation',
        op: 'Test span category',
      },
      (span) => new Promise<void>((res) => setTimeout(() => (span.end(), res()), Math.random() * 1000)),
    );

    return `Sentry Tracing. Level: ${level}`;
  }

  @ApiQuery({
    type: SentryErrorQueryDto,
  })
  @Get('error')
  async testError(@Query() query: Request['query']): Promise<void> {
    if (query.isUserError === 'true') {
      throw new ForbiddenException('This is no access exception, generated for sentry example.');
    }

    JSON.parse('Not JSON Text');
  }
}
