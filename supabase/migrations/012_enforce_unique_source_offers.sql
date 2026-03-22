-- =====================================================
-- MIGRATION: 012_enforce_unique_source_offers
-- Enforce dedupe for external source offer ingestion
-- =====================================================

ALTER TABLE credit_card_offers
  ADD COLUMN IF NOT EXISTS source_external_id TEXT;

-- Remove duplicate source offers before adding uniqueness guard.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY source_provider, source_external_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM credit_card_offers
  WHERE source_provider IS NOT NULL
    AND source_external_id IS NOT NULL
)
DELETE FROM credit_card_offers
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_card_offers_source_external
  ON credit_card_offers (source_provider, source_external_id)
  WHERE source_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_card_offers_source_external_id
  ON credit_card_offers (source_external_id);
