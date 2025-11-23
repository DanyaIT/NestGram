// import { Controller, Get } from '@nestjs/common';
// import { ApiResponse, ApiTags } from '@nestjs/swagger';
// import { CacheTestResponseDoto } from './dto/cahce-test-response.dto';
// import { CacheService } from './cache.service';
//
// @ApiTags('cache-test')
// @Controller('cache-test')
// export class CacheController {
//   constructor(private readonly cacheService: CacheService) {}
//
//   @Get('')
//   @ApiResponse({
//     type: CacheTestResponseDoto,
//   })
//   async test(): Promise<CacheTestResponseDoto> {
//     const testKey = 'test';
//     const testJson = { foo: 'bar' };
//     const testResult: CacheTestResponseDoto = {
//       isCleanSuccess: false,
//       isReadSuccess: false,
//       isWriteSuccess: false,
//     };
//
//     await this.cacheService.setJson(testKey, testJson);
//
//     const cached = await this.cacheService.getJson(testKey);
//     if (cached?.foo === testJson.foo) {
//       testResult.isWriteSuccess = true;
//     }
//
//     await this.cacheService.clear(testKey);
//     const uncached = await this.cacheService.getJson(testKey);
//     if (uncached === null) {
//       testResult.isCleanSuccess = true;
//       testResult.isReadSuccess = true;
//     }
//
//     return testResult;
//   }
// }
