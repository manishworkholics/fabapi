// src/bom/bom.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { BomService } from './bom.service';

describe('BomService', () => {
  let service: BomService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BomService,
        {
          // 1. Mock BOTH post variants used by the service
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            axiosRef: { post: jest.fn() },
          },
        },
        {
          // 2. Supply the two env keys the service expects
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'BOM_CHECKER_URL') return 'http://localhost:5001';
              if (key === 'BOM_CHECKER_UPLOAD_PATH')
                return '/api/external/bom-upload';
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<BomService>(BomService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should forward file upload to BOM-checker', async () => {
    const fakeForm = {};
    (httpService.post as jest.Mock).mockReturnValueOnce(
      of({ data: { received: true } }),
    );

    const result = await service.uploadBomFile(fakeForm as any);

    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:5001/api/external/bom-upload',
      fakeForm,
      expect.any(Object),
    );
    expect(result).toEqual({ received: true });
  });

  it('should POST JSON to /api/process-bom', async () => {
    const payload = { file_name: 'demo.xlsx', columns: [] };

    const fakeResp = { data: { success: true, mapping_id: 'xyz' } };
    (httpService.axiosRef.post as jest.Mock).mockResolvedValueOnce(fakeResp);

    const result = await service.processBom(payload);

    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      'http://localhost:5001/api/process-bom',
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual(fakeResp.data);
  });
});
