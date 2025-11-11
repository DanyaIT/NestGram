import { BadGatewayException, Controller, Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { fetch } from 'undici';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { CacheService } from '@src/cache/cache.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('health')
  getHealth(): string {
    return this.appService.getHello();
  }

  @Get('get-model')
  @ApiQuery({
    required: true,
    name: 'pathname',
    example: 'promo/novyy-god',
  })
  @ApiQuery({
    required: false,
    name: 'region',
    example: 'spb',
  })
  async getModelJson(@Query('pathname') pathname: string, @Query('region') region = ''): Promise<unknown> {
    const modelJsonHost = this.configService.get('MODEL_JSON_HOST');

    if (!modelJsonHost) {
      throw new BadGatewayException(
        'MODEL_JSON_HOST was not set in the app configuration, try to set MODEL_JSON_HOST value in the node envinronment',
      );
    }

    // trim useless "/"
    pathname = pathname.replace(/^\/|\/$/, '');

    const cahcheKey = `model-json/${region}/${pathname}`;

    let modelJson: any = await this.cacheService.getJson(cahcheKey);
    // if You want to use Sentry (import { startSpan } from '@sentry/node'):
    // let modelJson: any = await startSpan(
    //   {
    //     name: 'Get Redis Data',
    //   },
    //   () => this.cacheService.getJson(cahcheKey),
    // );

    if (!modelJson) {
      modelJson = await fetch(`https://${region ? `${region}.` : ''}${modelJsonHost}/${pathname}.model.json`).then(
        (r) => r.json(),
      );
      // if You want to use Sentry (import { startSpan } from '@sentry/node'):
      // modelJson = await startSpan(
      //   {
      //     name: 'Get Fudzi Data',
      //   },
      //   () =>
      //     fetch(`https://${region ? `${region}.` : ''}${modelJsonHost}/${pathname}.model.json`).then((r) => r.json()),
      // );

      await this.cacheService.setJson(cahcheKey, modelJson);
    }

    return modelJson;
  }
}
