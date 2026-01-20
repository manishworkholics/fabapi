import { Module } from '@nestjs/common';
import { OtpResolver } from './otp.resolver';
import { OtpService } from './otp.service';

@Module({
  providers: [OtpResolver, OtpService],
  exports: [OtpService],
})
export class OtpModule {}
