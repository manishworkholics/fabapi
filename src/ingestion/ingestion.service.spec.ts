import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionWorker } from './ingestion.worker';
import { S3_CLIENT } from '../s3/s3.provider';

describe('IngestionService', () => {
  let service: IngestionService;
  let prismaService: PrismaService;
  let worker: IngestionWorker;
  let s3Client: any;

  const mockPrismaService = {
    ingestionJob: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockWorker = {
    runJob: jest.fn(),
    handleStagedUpload: jest.fn(),
  };

  const mockS3Client = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: IngestionWorker,
          useValue: mockWorker,
        },
        {
          provide: S3_CLIENT,
          useValue: mockS3Client,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    prismaService = module.get<PrismaService>(PrismaService);
    worker = module.get<IngestionWorker>(IngestionWorker);
    s3Client = module.get(S3_CLIENT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startIngestion', () => {
    it('should create a job with queued status', async () => {
      // Arrange
      const userId = '123';
      const dto = { sourceUrl: 'https://example.com/file.zip' };
      const mockJob = {
        id: 'job-123',
        userId,
        sourceUrl: dto.sourceUrl,
        status: 'queued',
      };

      mockPrismaService.ingestionJob.create.mockResolvedValue(mockJob);
      mockWorker.runJob.mockResolvedValue(undefined);

      // Act
      const result = await service.startIngestion(userId, dto);

      // Assert
      expect(result).toEqual({
        jobId: 'job-123',
        status: 'queued',
      });
      expect(mockPrismaService.ingestionJob.create).toHaveBeenCalledWith({
        data: {
          userId,
          sourceUrl: dto.sourceUrl,
          status: 'queued',
        },
      });
      expect(mockWorker.runJob).toHaveBeenCalledWith('job-123');
    });

    it('should handle worker errors gracefully', async () => {
      // Arrange
      const userId = '123';
      const dto = { sourceUrl: 'https://example.com/file.zip' };
      const mockJob = {
        id: 'job-123',
        userId,
        sourceUrl: dto.sourceUrl,
        status: 'queued',
      };

      mockPrismaService.ingestionJob.create.mockResolvedValue(mockJob);
      mockWorker.runJob.mockRejectedValue(new Error('Download failed'));

      // Act
      const result = await service.startIngestion(userId, dto);

      // Assert
      // Should still return the job ID even if worker fails
      expect(result).toEqual({
        jobId: 'job-123',
        status: 'queued',
      });
    });
  });

  describe('stageUpload', () => {
    it('should create a staged job and process upload', async () => {
      // Arrange
      const userId = '123';
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.zip',
        size: 1024,
      } as Express.Multer.File;

      const mockJob = {
        id: 'job-456',
        userId,
        sourceUrl: 'test.zip',
        status: 'staged',
      };

      mockPrismaService.ingestionJob.create.mockResolvedValue(mockJob);
      mockWorker.handleStagedUpload.mockResolvedValue(undefined);

      // Act
      const result = await service.stageUpload(userId, file);

      // Assert
      expect(result).toEqual({
        jobId: 'job-456',
        status: 'staged',
      });
      expect(mockPrismaService.ingestionJob.create).toHaveBeenCalled();
      expect(mockWorker.handleStagedUpload).toHaveBeenCalledWith(
        'job-456',
        userId,
        file.buffer,
        file.originalname,
      );
    });

    it('should reject files exceeding size limit', async () => {
      // Arrange
      const userId = '123';
      const largeSizeMB = 100; // Assuming default is 50MB
      const file = {
        buffer: Buffer.alloc(largeSizeMB * 1024 * 1024),
        originalname: 'large.zip',
        size: largeSizeMB * 1024 * 1024,
      } as Express.Multer.File;

      // Act & Assert
      await expect(service.stageUpload(userId, file)).rejects.toThrow(
        /File size exceeds/,
      );
    });
  });

  describe('getRecentFiles', () => {
    it('should return list of files with presigned URLs', async () => {
      // Arrange
      const userId = '123';
      const limit = 5;
      const mockJobs = [
        {
          s3Key: 'ingestions/123/job-1.zip',
          createdAt: new Date(),
          sizeBytes: BigInt(1024),
          sha256: 'abc123',
          s3Bucket: 'test-bucket',
        },
        {
          s3Key: 'ingestions/123/job-2.zip',
          createdAt: new Date(),
          sizeBytes: BigInt(2048),
          sha256: 'def456',
          s3Bucket: 'test-bucket',
        },
      ];

      mockPrismaService.ingestionJob.findMany.mockResolvedValue(mockJobs);

      // Act
      const result = await service.getRecentFiles(userId, limit);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('url');
      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('sha256');
      expect(mockPrismaService.ingestionJob.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: expect.any(Object),
      });
    });

    it('should return empty array when no completed jobs exist', async () => {
      // Arrange
      const userId = '123';
      const limit = 5;

      mockPrismaService.ingestionJob.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getRecentFiles(userId, limit);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getFileById', () => {
    it('should return file info for valid job ID', async () => {
      // Arrange
      const userId = '123';
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        userId,
        status: 'completed',
        s3Bucket: 'test-bucket',
        s3Key: 'ingestions/123/job-123.zip',
        sizeBytes: BigInt(1024),
        sha256: 'abc123',
      };

      mockPrismaService.ingestionJob.findUnique.mockResolvedValue(mockJob);

      // Act
      const result = await service.getFileById(userId, jobId);

      // Assert
      expect(result).toEqual({
        bucket: 'test-bucket',
        key: 'ingestions/123/job-123.zip',
        sizeBytes: BigInt(1024),
        sha256: 'abc123',
      });
    });

    it('should throw NotFoundException for non-existent job', async () => {
      // Arrange
      const userId = '123';
      const jobId = 'non-existent';

      mockPrismaService.ingestionJob.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getFileById(userId, jobId)).rejects.toThrow();
    });

    it('should throw NotFoundException when user does not own job', async () => {
      // Arrange
      const userId = '123';
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        userId: '456', // Different user
        status: 'completed',
        s3Bucket: 'test-bucket',
        s3Key: 'ingestions/456/job-123.zip',
      };

      mockPrismaService.ingestionJob.findUnique.mockResolvedValue(mockJob);

      // Act & Assert
      await expect(service.getFileById(userId, jobId)).rejects.toThrow();
    });

    it('should throw NotFoundException when job is not completed', async () => {
      // Arrange
      const userId = '123';
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        userId,
        status: 'downloading', // Not completed
        s3Bucket: null,
        s3Key: null,
      };

      mockPrismaService.ingestionJob.findUnique.mockResolvedValue(mockJob);

      // Act & Assert
      await expect(service.getFileById(userId, jobId)).rejects.toThrow();
    });
  });

  describe('getS3ObjectMetadata', () => {
    it('should return S3 object metadata', async () => {
      // Arrange
      const bucket = 'test-bucket';
      const key = 'test-key';
      const mockMetadata = {
        ContentType: 'application/zip',
        ContentLength: 1024,
        ETag: '"abc123"',
      };

      mockS3Client.send.mockResolvedValue(mockMetadata);

      // Act
      const result = await service.getS3ObjectMetadata(bucket, key);

      // Assert
      expect(result).toEqual({
        contentType: 'application/zip',
        contentLength: 1024,
        etag: '"abc123"',
      });
    });

    it('should throw NotFoundException when S3 object not found', async () => {
      // Arrange
      const bucket = 'test-bucket';
      const key = 'non-existent';

      mockS3Client.send.mockRejectedValue(new Error('NoSuchKey'));

      // Act & Assert
      await expect(service.getS3ObjectMetadata(bucket, key)).rejects.toThrow();
    });
  });
});

