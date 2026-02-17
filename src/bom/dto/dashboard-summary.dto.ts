// src/bom/dto/dashboard-summary.dto.ts
export interface SupplierRowDto {
  name: string;
  reference: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  backOrder: number;
  leadTime: string | null;
  moq: number | null;
}

export interface SupplierPanelDto {
  found: number;
  notFound: number;
  backOrder: number;
  obsolete: number;
  rows: SupplierRowDto[];
}

export interface DashboardSummaryDto {
  digikey: SupplierPanelDto;
  mouser: SupplierPanelDto;
}
