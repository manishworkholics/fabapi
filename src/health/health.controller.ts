import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorators';

@Controller('health')
export class HealthController {
  constructor() {}

  @Public()
  @Get()
  check() {
    return {
      status: 'success',
      message: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
