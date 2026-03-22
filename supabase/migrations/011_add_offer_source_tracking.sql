-- =====================================================
-- MIGRATION: 011_add_offer_source_tracking
-- Track external source coverage and sync health for offers
-- =====================================================

-- =====================================================
-- TABLE: credit_card_offer_sources
-- Stores all crawled source pages and fetch status
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_card_offer_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_category TEXT,
  source_title TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  http_status INTEGER,
  checksum TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, source_url)
);

ALTER TABLE credit_card_offer_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read offer source sync records" ON credit_card_offer_sources;
CREATE POLICY "Anyone can read offer source sync records"
  ON credit_card_offer_sources FOR SELECT
  USING (TRUE);

CREATE INDEX IF NOT EXISTS idx_offer_sources_provider ON credit_card_offer_sources (provider);
CREATE INDEX IF NOT EXISTS idx_offer_sources_status_fetched_at ON credit_card_offer_sources (status, fetched_at DESC);

-- =====================================================
-- TABLE ALTER: credit_card_offers
-- Adds source metadata for ranking and freshness
-- =====================================================
ALTER TABLE credit_card_offers
  ADD COLUMN IF NOT EXISTS source_provider TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_image_url TEXT,
  ADD COLUMN IF NOT EXISTS source_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_match_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_card_offers_source_provider ON credit_card_offers (source_provider);
CREATE INDEX IF NOT EXISTS idx_card_offers_source_url ON credit_card_offers (source_url);
CREATE INDEX IF NOT EXISTS idx_card_offers_source_synced_at ON credit_card_offers (source_last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_offers_source_categories ON credit_card_offers USING GIN (source_categories);
