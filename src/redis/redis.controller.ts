import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { RedisTestResponseDTO } from './dto/cahce-test-response.dto';
import { RedisService } from './redis.service';
import { isPublic } from '@src/auth/decorators/public.decorator';

@ApiTags('cache-test') //FIXME: Del it later
@Controller('cache-test')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @isPublic()
  @Get('')
  @ApiResponse({
    type: RedisTestResponseDTO,
  })
  async test(): Promise<RedisTestResponseDTO> {
    const testKey = 'test';
    const testJson = { foo: 'bar' };
    const testResult: RedisTestResponseDTO = {
      isCleanSuccess: false,
      isReadSuccess: false,
      isWriteSuccess: false,
    };

    await this.redisService.setJson(testKey, testJson);

    const cached = await this.redisService.getJson(testKey);

    if (cached?.foo === testJson.foo) {
      testResult.isWriteSuccess = true;
    }

    await this.redisService.clear(testKey);
    const uncached = await this.redisService.getJson(testKey);
    if (uncached === null) {
      testResult.isCleanSuccess = true;
      testResult.isReadSuccess = true;
    }

    return testResult;
  }
}
