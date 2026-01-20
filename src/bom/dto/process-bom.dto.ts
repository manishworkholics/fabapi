// src/bom/dto/process-bom.dto.ts
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';

/** Spreadsheet → field mapping coming from the FE */
export class ColumnMappingDto {
  @IsString() name!: string;
  @IsString() mapping!: string;
}

/** Payload for PATCH /bom/process */
export class ProcessBomDto {
  /** BomUpload.id returned from /bom/upload */
  @IsInt() uploadId!: number;

  /** Comma-separated list of board quantities (e.g., "1,5,10") */
  @IsString() buildQuantities!: string;

  /** Spreadsheet mappings */
  @IsArray() @ArrayNotEmpty() columns!: ColumnMappingDto[];

  /** Optional board build date (ISO 8601 – e.g. "2025-06-15") */
  @IsDateString() @IsOptional() buildDate?: string;
}
