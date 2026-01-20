// src/bom/bom.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import * as FormData from 'form-data';
import { firstValueFrom } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JWTPayload } from '../auth/types';

import { BomService } from './bom.service';
import { ProcessBomDto } from './dto/process-bom.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('bom')
@ApiBearerAuth()
@Controller('bom')
@UseGuards(AccessTokenGuard)
export class BomController {
  private readonly logger = new Logger(BomController.name);

  constructor(private readonly bomService: BomService) {}

  /* ─── Test Bom Checker Health (excluded from Swagger) ────────────────────────────────────────────── */
  @Get('test')
  @ApiExcludeEndpoint()
  async test() {
    this.logger.debug('Test endpoint hit');
    await this.bomService.healthCheck();
    return {
      status: 'ok',
      message: 'Bom Checker is running',
    };
  }

  /* ─── Upload spreadsheet (excluded from Swagger) ────────────────────────────────────────── */
  @Post('upload')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @AuthUser() user: JWTPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.debug(
      `User ${user.userId} is uploading BOM file: ${file.originalname}`,
    );
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return this.bomService.uploadBomFile(form, user);
  }

  /* ─── Process column‐mapping + quantities (excluded from Swagger) ─────────────────────────── */
  @Patch('process')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async process(@Body() dto: ProcessBomDto) {
    const processedRows = await this.bomService.processBom(dto);
    return {
      status: 'ok',
      rows: processedRows,
      total_rows: processedRows.length,
    };
  }

  /* ─── Stream Digi-Key look-ups (excluded from Swagger) ────────────────────────────────────── */
  @Post('stream-digikey')
  @ApiExcludeEndpoint()
  async streamDigikey(
    @Body('rows') rows: any[],
    @Body('uploadId') uploadId: number,
    @Res() res: Response,
  ) {
    const streamRes = await firstValueFrom(
      this.bomService.streamDigikey(rows, uploadId),
    );
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'application/x-ndjson');
    streamRes.data.pipe(res);
  }

  /* ─── Stream Mouser look-ups (excluded from Swagger) ───────────────────────────────────────── */
  @Post('stream-mouser')
  @ApiExcludeEndpoint()
  async streamMouser(
    @Body('rows') rows: any[],
    @Body('uploadId') uploadId: number,
    @Res() res: Response,
  ) {
    const streamRes = await firstValueFrom(
      this.bomService.streamMouser(rows, uploadId),
    );
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'application/x-ndjson');
    streamRes.data.pipe(res);
  }

  /* ─── Dashboard – aggregated view for a given build quantity ───────────────────────────────── */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get aggregated dashboard data for a specific upload and quantity',
  })
  @ApiQuery({
    name: 'uploadId',
    type: Number,
    description: 'The BOM upload ID returned from /bom/upload',
    required: true,
  })
  @ApiQuery({
    name: 'qty',
    type: Number,
    description: 'The build quantity to aggregate against',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns supplier panels (digikey and mouser) with counts and detail rows',
    schema: {
      properties: {
        digikey: {
          type: 'object',
          properties: {
            found: { type: 'number', example: 10 },
            notFound: { type: 'number', example: 2 },
            backOrder: { type: 'number', example: 1 },
            obsolete: { type: 'number', example: 0 },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'TBP02P1-381-16BE' },
                  reference: { type: 'string', example: 'J1', nullable: true },
                  quantity: { type: 'number', example: 10 },
                  unitPrice: { type: 'number', example: 1.23, nullable: true },
                  totalPrice: { type: 'number', example: 12.3, nullable: true },
                  backOrder: { type: 'number', example: 0 },
                  leadTime: {
                    type: 'string',
                    example: '2 weeks',
                    nullable: true,
                  },
                  moq: { type: 'number', example: 5, nullable: true },
                },
              },
            },
          },
        },
        mouser: {
          type: 'object',
          properties: {
            found: { type: 'number', example: 8 },
            notFound: { type: 'number', example: 4 },
            backOrder: { type: 'number', example: 2 },
            obsolete: { type: 'number', example: 0 },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'TBP02P1-381-16BE' },
                  reference: { type: 'string', example: 'J1', nullable: true },
                  quantity: { type: 'number', example: 10 },
                  unitPrice: { type: 'number', example: 1.5, nullable: true },
                  totalPrice: { type: 'number', example: 15.0, nullable: true },
                  backOrder: { type: 'number', example: 0 },
                  leadTime: {
                    type: 'string',
                    example: '3 weeks',
                    nullable: true,
                  },
                  moq: { type: 'number', example: 10, nullable: true },
                },
              },
            },
          },
        },
      },
    },
  })
  async dashboard(
    @Query('uploadId', ParseIntPipe) uploadId: number,
    @Query('qty', ParseIntPipe) qty: number,
  ): Promise<DashboardSummaryDto> {
    return this.bomService.getDashboardSummary(uploadId, qty);
  }
}
