-- 1) Drop the old view if it exists
DROP MATERIALIZED VIEW IF EXISTS "vw_bom_supplier_metrics";

-- 2) Recreate it properly as a MATERIALIZED VIEW
CREATE MATERIALIZED VIEW "vw_bom_supplier_metrics" AS
SELECT
  u.id                            AS upload_id,
  unnest(u."buildQuantities")     AS qty,
  l.source                        AS supplier,
  COUNT(*) FILTER (WHERE l.status = 'FOUND')     AS found,
  COUNT(*) FILTER (WHERE l.status = 'NOT_FOUND') AS not_found,
  COUNT(*) FILTER (WHERE l.status = 'BACKORDER') AS back_order,
  COUNT(*) FILTER (WHERE l.status = 'OBSOLETE')  AS obsolete
FROM "BomUpload" u
JOIN "BomRow"    r ON r."uploadId" = u.id
JOIN "BomLookup" l ON l."rowId"     = r.id
GROUP BY u.id, qty, l.source
WITH NO DATA;

-- 3) Index for fast lookups
CREATE UNIQUE INDEX idx_bom_metrics_upload_qty_supplier
  ON "vw_bom_supplier_metrics"(upload_id, qty, supplier);

-- populate initial data
REFRESH MATERIALIZED VIEW vw_bom_supplier_metrics;
