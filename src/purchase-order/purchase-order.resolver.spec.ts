import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderResolver } from './purchase-order.resolver';

describe('PurchaseOrderResolver', () => {
  let resolver: PurchaseOrderResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderResolver],
    }).compile();

    resolver = module.get<PurchaseOrderResolver>(PurchaseOrderResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
