import { Test, TestingModule } from '@nestjs/testing';
import { OtpResolver } from './otp.resolver';

describe('OtpResolver', () => {
  let resolver: OtpResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpResolver],
    }).compile();

    resolver = module.get<OtpResolver>(OtpResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
