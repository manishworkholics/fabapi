// src/bom/dto/add-quantity.dto.ts
import { IsInt, Min } from 'class-validator';

/**
 * PATCH /bom/quantity — add one new build quantity for an existing BomUpload
 */
export class AddQuantityDto {
  /** BomUpload.id that the new quantity belongs to */
  @IsInt()
  uploadId!: number;

  /** Positive integer quantity (e.g. 25, 100, 250 …) */
  @IsInt()
  @Min(1)
  quantity!: number;
}
