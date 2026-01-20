// src/bom/bom.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { BomController } from './bom.controller';
import { BomService } from './bom.service';
import * as FormData from 'form-data';

//
// ─── UNIT TESTS FOR BomController ─────────────────────────────────────────────
//

describe('BomController (upload)', () => {
  let controller: BomController;
  let service: BomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BomController],
      providers: [
        {
          provide: BomService,
          useValue: { uploadBomFile: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<BomController>(BomController);
    service = module.get<BomService>(BomService);
  });

  it('should forward file upload to BomService.uploadBomFile', async () => {
    // fake a file object from @UploadedFile()
    const file = {
      buffer: Buffer.from('test'),
      originalname: 'test.xlsx',
    } as any;

    // service.uploadBomFile will resolve to this
    (service.uploadBomFile as jest.Mock).mockResolvedValue({ success: true });

    const result = await controller.upload(file);

    // expect we passed FormData into the service
    expect(service.uploadBomFile).toHaveBeenCalledWith(expect.any(FormData));
    expect(result).toEqual({ success: true });
  });
});

describe('BomController (process)', () => {
  let controller: BomController;
  let service: BomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BomController],
      providers: [
        {
          provide: BomService,
          useValue: { processBom: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<BomController>(BomController);
    service = module.get<BomService>(BomService);
  });

  it('should forward payload to BomService.processBom', async () => {
    const payload = { file_name: 'demo.xlsx', columns: [] };
    const fakeResult = { success: true, mapping_id: 'abc123' };

    // stub out the service
    (service.processBom as jest.Mock).mockResolvedValue(fakeResult);

    const result = await controller.process(payload as any);

    expect(service.processBom).toHaveBeenCalledWith(payload);
    expect(result).toEqual(fakeResult);
  });
});
