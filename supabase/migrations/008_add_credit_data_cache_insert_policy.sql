-- Migration: Add INSERT policy for credit_data_cache
-- This allows users to insert credit data for their own cards

CREATE POLICY "Users can insert own credit data"
  ON credit_data_cache FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM connected_credit_cards
      WHERE connected_credit_cards.id = credit_data_cache.card_id
      AND connected_credit_cards.user_id = auth.uid()
    )
  );
