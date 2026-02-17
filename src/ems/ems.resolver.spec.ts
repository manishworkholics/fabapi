import { Test, TestingModule } from '@nestjs/testing';
import { EMSResolver } from './ems.resolver';
import { EMSService } from './ems.service';

describe('EMSResolver', () => {
  let resolver: EMSResolver;

  beforeEach(async () => {
    const mockEMSService = {
      findAllEMS: jest.fn(),
      findAvailableEMS: jest.fn(),
      emsDetails: jest.fn(),
      findAllManufacturers: jest.fn(),
      findManufacturerById: jest.fn(),
      searchManufacturers: jest.fn(),
      findManufacturersByLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EMSResolver,
        {
          provide: EMSService,
          useValue: mockEMSService,
        },
      ],
    }).compile();

    resolver = module.get<EMSResolver>(EMSResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
