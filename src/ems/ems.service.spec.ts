import { Test, TestingModule } from '@nestjs/testing';
import { EMSService } from './ems.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EMSService', () => {
  let service: EMSService;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      eMSManufacturer: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EMSService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EMSService>(EMSService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
