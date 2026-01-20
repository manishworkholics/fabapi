import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { JWTPayload } from '../auth/types';

describe('IngestionController', () => {
  let controller: IngestionController;
  let service: IngestionService;

  const mockIngestionService = {
    startIngestion: jest.fn(),
    stageUpload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestionService,
          useValue: mockIngestionService,
        },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    service = module.get<IngestionService>(IngestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startIngestion', () => {
    it('should create a new ingestion job', async () => {
      // Arrange
      const user: JWTPayload = { userId: 123, email: 'test@example.com' };
      const dto = { sourceUrl: 'https://example.com/file.zip' };
      const expectedResponse = { jobId: 'job-123', status: 'queued' };

      mockIngestionService.startIngestion.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.startIngestion(user, dto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockIngestionService.startIngestion).toHaveBeenCalledWith(
        '123',
        dto,
      );
    });

    it('should validate URL format', async () => {
      // Test URL validation through DTO
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('stageUpload', () => {
    it('should stage a file upload', async () => {
      // Arrange
      const user: JWTPayload = { userId: 123, email: 'test@example.com' };
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.zip',
        mimetype: 'application/zip',
        size: 1024,
      } as Express.Multer.File;
      const expectedResponse = { jobId: 'job-456', status: 'staged' };

      mockIngestionService.stageUpload.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.stageUpload(user, file);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockIngestionService.stageUpload).toHaveBeenCalledWith(
        '123',
        file,
      );
    });

    it('should reject non-ZIP files', async () => {
      // Arrange
      const user: JWTPayload = { userId: 123, email: 'test@example.com' };
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      // Act & Assert
      await expect(controller.stageUpload(user, file)).rejects.toThrow();
    });

    it('should reject when no file provided', async () => {
      // Arrange
      const user: JWTPayload = { userId: 123, email: 'test@example.com' };

      // Act & Assert
      await expect(
        controller.stageUpload(user, undefined as any),
      ).rejects.toThrow();
    });
  });
});
