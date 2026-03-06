-- =====================================================
-- Migration 009: Add card_transactions table
-- Mirrors the exact Flinks /GetAccountsDetail transaction structure.
-- Deduplication is enforced via UNIQUE(card_id, flinks_transaction_id)
-- so upserting real Flinks data later is safe with ON CONFLICT DO NOTHING.
-- =====================================================

CREATE TABLE IF NOT EXISTS card_transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id               UUID NOT NULL REFERENCES connected_credit_cards(id) ON DELETE CASCADE,
  -- Flinks returns a UUID per transaction; used for idempotent upserts
  flinks_transaction_id TEXT NOT NULL,
  date                  DATE NOT NULL,
  description           TEXT NOT NULL,let
  -- Flinks splits amount into debit (spend) and credit (payment/refund)
  debit                 NUMERIC(12, 2),  -- positive = card balance increases
  credit                NUMERIC(12, 2),  -- positive = card balance decreases
  balance               NUMERIC(12, 2),  -- running balance after this transaction
  -- Populated from Flinks /GetCategorization (Enrich) when available
  raw_category          TEXT,
  synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, flinks_transaction_id)
);

-- RLS: users can only see transactions for their own cards
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connected_credit_cards
      WHERE connected_credit_cards.id = card_transactions.card_id
        AND connected_credit_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON card_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM connected_credit_cards
      WHERE connected_credit_cards.id = card_transactions.card_id
        AND connected_credit_cards.user_id = auth.uid()
    )
  );

CREATE INDEX idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_date    ON card_transactions(card_id, date DESC);
