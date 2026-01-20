// src/bom/bom.service.ts
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma, BomSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { AxiosResponse } from 'axios';

import { ProcessBomDto } from './dto/process-bom.dto';
import { AddQuantityDto } from './dto/add-quantity.dto';
import {
  DashboardSummaryDto,
  SupplierRowDto,
} from './dto/dashboard-summary.dto';

/*──────────────────────── utilities ────────────────────────*/
const parseQuantities = (raw: string): number[] =>
  [
    ...new Set(
      raw
        .split(',')
        .map((s) => +s.trim())
        .filter((n) => n > 0),
    ),
  ].sort((a, b) => a - b);

/*──────────────────────── service ───────────────────────────*/
@Injectable()
export class BomService {
  private readonly log = new Logger(BomService.name);
  private readonly baseUrl: string;
  private readonly uploadPath: string;

  constructor(
    private readonly http: HttpService,
    cfg: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = (cfg.get<string>('BOM_CHECKER_URL') ?? '').replace(
      /\/$/,
      '',
    );
    this.uploadPath =
      cfg.get<string>('BOM_CHECKER_UPLOAD_PATH') || '/api/upload';
    console.log(`BOM Checker URL: ${this.baseUrl}${this.uploadPath}`);
  }

  /* ────────────────────── health check ────────────────────── */
  async healthCheck() {
    try {
      this.log.debug('Performing BOM checker health check');
      const data = await firstValueFrom(
        this.http.get(`${this.baseUrl}/health`),
      );
      return data;
    } catch (e: any) {
      this.log.error('healthCheck failed', e?.response?.data);
      throw new HttpException(
        e?.response?.data || 'BOM checker health check failed',
        e?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /* ───────────────────────── STEP-1  upload ───────────────────────── */
  async uploadBomFile(form: any, user: { userId: number }) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}${this.uploadPath}`, form, {
          headers: form.getHeaders?.(),
        }),
      );

      // 1️⃣ save BomUpload and capture the generated ID
      const saved = await this.prisma.bomUpload.create({
        data: {
          userId: user.userId,
          fileName: data.file_name,
          rowCount: data.row_count,
        },
      });

      this.log.verbose(`saved BomUpload for user ${user.userId}`);

      // 2️⃣ return uploadId together with the original bom-checker payload
      return { uploadId: saved.id, ...data };
    } catch (e: any) {
      this.log.error('uploadBomFile failed', e?.response?.data);
      throw new HttpException(
        e?.response?.data || 'BOM upload failed',
        e?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /* ───────────────────────── STEP-2  process ───────────────────────── */
  async processBom(dto: ProcessBomDto): Promise<any[]> {
    const upload = await this.prisma.bomUpload.findUnique({
      where: { id: dto.uploadId },
    });
    if (!upload) throw new BadRequestException('Invalid uploadId');

    await this.prisma.bomUpload.update({
      where: { id: upload.id },
      data: {
        buildQuantities: parseQuantities(dto.buildQuantities),
        columnMapping: dto.columns as unknown as Prisma.JsonObject,
        buildDate: dto.buildDate ? new Date(dto.buildDate) : undefined,
      },
    });

    const upstream = await this.http.axiosRef.post(
      `${this.baseUrl}/api/process-bom`,
      { file_name: upload.fileName, columns: dto.columns },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const rows: Array<{
      row_index: number;
      mpns: string[];
      manufacturer: string | null;
      quantity: number;
      reference?: string | null;
    }> = upstream.data.rows;

    await this.prisma.$transaction(
      async (tx) => {
        await tx.bomRow.deleteMany({ where: { uploadId: upload.id } });

        this.log.debug(
          `Processing ${rows.length} BOM rows for upload ID ${upload.id}`,
        );

        for (const row of rows) {
          await tx.bomRow.create({
            data: {
              uploadId: upload.id,
              rowIndex: row.row_index,
              mpns: row.mpns,
              manufacturer: row.manufacturer,
              quantity:
                typeof row.quantity === 'number'
                  ? row.quantity
                  : ((row as any).Quantity ?? 1),
              reference: row.reference ?? null,
              lookups: {
                create: row.mpns.flatMap((mpn) =>
                  (['DIGIKEY', 'MOUSER'] as BomSource[]).map((src) => ({
                    source: src,
                    mpn,
                    requestJson: { mpn, manufacturer: row.manufacturer },
                  })),
                ),
              },
            },
          });
        }
      },
      { maxWait: 15000, timeout: 20000 },
    );

    // Return the processed rows so controller can respond with them
    return rows;
  }

  /* ───────────────────────── STEP-2b  add quantity ───────────────────────── */
  async addQuantity(dto: AddQuantityDto): Promise<void> {
    const { uploadId, quantity } = dto;

    if (quantity <= 0)
      throw new BadRequestException('Quantity must be a positive integer');

    const upload = await this.prisma.bomUpload.findUnique({
      where: { id: uploadId },
      select: { buildQuantities: true },
    });

    if (!upload) throw new BadRequestException('Invalid uploadId');

    const existing: number[] = Array.isArray(upload.buildQuantities)
      ? upload.buildQuantities
      : [];

    if (existing.includes(quantity))
      throw new BadRequestException('Quantity already exists');

    const newList = [...existing, quantity].sort((a, b) => a - b);

    await this.prisma.bomUpload.update({
      where: { id: uploadId },
      data: { buildQuantities: newList },
    });

    await this.refreshSupplierMetrics();
  }

  /* ───────────── STEP-3  supplier streams (wrappers) ───────────── */
  streamDigikey(rows: any[], uploadId: number) {
    return this.genericStream(
      `${this.baseUrl}/api/stream-digikey-results`,
      'DIGIKEY',
      rows,
      uploadId,
    );
  }
  streamMouser(rows: any[], uploadId: number) {
    return this.genericStream(
      `${this.baseUrl}/api/stream-mouser-results`,
      'MOUSER',
      rows,
      uploadId,
    );
  }

  /* ─────────────────── core stream handler ─────────────────── */
  private genericStream(
    url: string,
    source: 'DIGIKEY' | 'MOUSER',
    rows: any[],
    uploadId: number,
  ): Observable<AxiosResponse<any>> {
    const res$ = this.http.post(
      url,
      { rows },
      { responseType: 'stream' as any },
    );

    return res$.pipe(
      tap(({ data }) => {
        let buf = '';
        data.on('data', async (chunk: Buffer) => {
          buf += chunk.toString();
          let nl;
          while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;

            try {
              const evt = JSON.parse(line);
              if (
                !['found', 'not_found', 'back_order', 'obsolete'].includes(
                  evt.event,
                )
              )
                continue;

              /* normalise DigiKey/Mouser price arrays → { "1":3.22,… } */
              const rawBreaks =
                evt.data.price_breaks ?? evt.data.PriceBreaks ?? [];
              const priceMap = Object.fromEntries(
                rawBreaks.map((b: any) => [
                  String(b.quantity ?? b.Quantity),
                  Number(String(b.price ?? b.Price).replace(/^\$/, '')),
                ]),
              );

              await this.prisma.bomLookup.updateMany({
                where: { mpn: evt.data.mpn, source, row: { uploadId } },
                data: {
                  status:
                    evt.event === 'found'
                      ? 'FOUND'
                      : evt.event === 'not_found'
                        ? 'NOT_FOUND'
                        : evt.event === 'back_order'
                          ? 'BACKORDER'
                          : 'OBSOLETE',
                  responseJson: evt.data,
                  quantityAvailable: evt.data.quantity_available ?? null,
                  scaledPriceBands: priceMap,
                },
              });

              await this.refreshSupplierMetrics();
            } catch {
              this.log.warn(`failed to parse NDJSON line: ${line}`);
            }
          }
        });
      }),
    );
  }

  /* ───────────────────── dashboard aggregation ───────────────────── */
  async getDashboardSummary(
    uploadId: number,
    qty: number,
  ): Promise<DashboardSummaryDto> {
    /* supplier aggregates */
    const aggsRaw = await this.prisma.$queryRaw<
      Array<{
        supplier: string;
        found: bigint;
        not_found: bigint;
        back_order: bigint;
        obsolete: bigint;
      }>
    >`
      SELECT supplier, found, not_found, back_order, obsolete
      FROM "vw_bom_supplier_metrics"
      WHERE upload_id = ${uploadId} AND qty = ${qty};
    `;

    const panel = {
      digikey: {
        found: 0,
        notFound: 0,
        backOrder: 0,
        obsolete: 0,
        rows: [] as SupplierRowDto[],
      },
      mouser: {
        found: 0,
        notFound: 0,
        backOrder: 0,
        obsolete: 0,
        rows: [] as SupplierRowDto[],
      },
    };
    aggsRaw.forEach((a) => {
      const k = a.supplier.toLowerCase() as 'digikey' | 'mouser';
      panel[k].found = Number(a.found);
      panel[k].notFound = Number(a.not_found);
      panel[k].backOrder = Number(a.back_order);
      panel[k].obsolete = Number(a.obsolete);
    });

    /* detail rows */
    const rows = await this.prisma.$queryRaw<
      Array<{
        supplier: string;
        name: string;
        reference: string | null;
        quantity: bigint;
        unit_price: string | null;
        total_price: string | null;
        back_order: bigint;
        lead_time: string | null;
        moq: bigint | null;
      }>
    >`
      SELECT
        l.source                     AS supplier,
        r.mpns[1]                    AS name,
        r.reference,
        r.quantity * ${qty}          AS quantity,

        /* highest break <= qty */
        (
          SELECT (value)::numeric
          FROM   jsonb_each_text(l."scaledPriceBands") AS t(break,value)
          WHERE  (t.break)::int <= ${qty}
          ORDER  BY (t.break)::int DESC
          LIMIT 1
        )                            AS unit_price,
        (
          SELECT (value)::numeric
          FROM   jsonb_each_text(l."scaledPriceBands") AS t(break,value)
          WHERE  (t.break)::int <= ${qty}
          ORDER  BY (t.break)::int DESC
          LIMIT 1
        ) * r.quantity * ${qty}      AS total_price,

        GREATEST(0,(r.quantity * ${qty})-COALESCE(l."quantityAvailable",0))
                                      AS back_order,
        l."responseJson" ->> 'lead_time_weeks'           AS lead_time,
        (l."responseJson" ->> 'minimum_order_quantity')::int AS moq
      FROM "BomRow" r
      JOIN "BomLookup" l ON l."rowId" = r.id
      WHERE r."uploadId" = ${uploadId}
        AND l.source IN ('DIGIKEY','MOUSER');
    `;

    rows.forEach((d) => {
      const k = d.supplier.toLowerCase() as 'digikey' | 'mouser';
      panel[k].rows.push({
        name: d.name,
        reference: d.reference,
        quantity: Number(d.quantity),
        unitPrice: d.unit_price ? Number(d.unit_price) : null,
        totalPrice: d.total_price ? Number(d.total_price) : null,
        backOrder: Number(d.back_order),
        leadTime: d.lead_time,
        moq: d.moq !== null ? Number(d.moq) : null,
      });
    });

    return { digikey: panel.digikey, mouser: panel.mouser };
  }

  /* ───────────────────── materialised view refresh ───────────────────── */
  private async refreshSupplierMetrics() {
    await this.prisma.$executeRawUnsafe(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY "vw_bom_supplier_metrics";`,
    );
  }
}
