-- =====================================================
-- DEMO TABLES IN PUBLIC SCHEMA
-- =====================================================
-- Mirrors demo schema tables inside public to avoid schema exposure issues.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: demo_users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr', 'ar')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: demo_cards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.demo_users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  card_name TEXT NOT NULL,
  card_last_four TEXT NOT NULL CHECK (LENGTH(card_last_four) = 4),
  card_network TEXT NOT NULL CHECK (card_network IN ('visa', 'mastercard', 'amex', 'other')),
  credit_limit NUMERIC(12, 2) NOT NULL,
  current_balance NUMERIC(12, 2) NOT NULL,
  available_credit NUMERIC(12, 2) NOT NULL,
  utilization_percentage NUMERIC(5, 2) NOT NULL CHECK (utilization_percentage >= 0 AND utilization_percentage <= 100),
  minimum_payment NUMERIC(12, 2) NOT NULL,
  payment_due_date DATE,
  interest_rate NUMERIC(5, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  opened_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.demo_cards ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_public_demo_cards_user_id ON public.demo_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_public_demo_cards_due_date ON public.demo_cards(payment_due_date);

-- =====================================================
-- TABLE: demo_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES public.demo_cards(id) ON DELETE CASCADE,
  posted_at DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  merchant TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'refund')),
  currency TEXT NOT NULL DEFAULT 'CAD',
  description TEXT
);

ALTER TABLE public.demo_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_public_demo_transactions_card_id ON public.demo_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_public_demo_transactions_posted_at ON public.demo_transactions(posted_at DESC);

-- =====================================================
-- TABLE: demo_payments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES public.demo_cards(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('posted', 'pending')),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'debit', 'bill_pay')),
  confirmation_ref TEXT
);

ALTER TABLE public.demo_payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_public_demo_payments_card_id ON public.demo_payments(card_id);
CREATE INDEX IF NOT EXISTS idx_public_demo_payments_payment_date ON public.demo_payments(payment_date DESC);

-- =====================================================
-- TABLE: demo_recommendations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.demo_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.demo_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recommendation', 'alert', 'tip')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.demo_recommendations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_public_demo_recommendations_user_id ON public.demo_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_public_demo_recommendations_priority ON public.demo_recommendations(priority, created_at DESC);

-- =====================================================
-- SEED DATA
-- =====================================================
INSERT INTO public.demo_users (id, full_name, email, preferred_language, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Amina Yusuf', 'amina.demo@creduman.ca', 'en', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Noah Tremblay', 'noah.demo@creduman.ca', 'fr', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demo_cards (
  id,
  user_id,
  institution_name,
  card_name,
  card_last_four,
  card_network,
  credit_limit,
  current_balance,
  available_credit,
  utilization_percentage,
  minimum_payment,
  payment_due_date,
  interest_rate,
  is_active,
  opened_at
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'RBC',
    'RBC Cash Back Visa',
    '4821',
    'visa',
    5000.00,
    1840.55,
    3159.45,
    36.81,
    55.00,
    '2026-02-20',
    20.99,
    TRUE,
    '2023-05-10'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Scotiabank',
    'Scotiabank Momentum Mastercard',
    '1440',
    'mastercard',
    9000.00,
    2450.10,
    6549.90,
    27.22,
    75.00,
    '2026-02-16',
    19.99,
    TRUE,
    '2022-11-02'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'Amex',
    'Amex Cobalt',
    '9003',
    'amex',
    12000.00,
    620.00,
    11380.00,
    5.17,
    25.00,
    '2026-03-05',
    21.99,
    TRUE,
    '2024-02-12'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demo_transactions (id, card_id, posted_at, amount, merchant, category, type, currency, description)
VALUES
  ('d1111111-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-02-03', 124.45, 'Loblaws', 'Groceries', 'purchase', 'CAD', 'Weekly groceries'),
  ('d1111111-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-02-01', 42.10, 'Spotify', 'Subscriptions', 'purchase', 'CAD', 'Monthly subscription'),
  ('d1111111-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-01-30', 180.25, 'Apple Store', 'Electronics', 'purchase', 'CAD', 'Accessories'),
  ('d1111111-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-02-02', 65.30, 'Petro-Canada', 'Fuel', 'purchase', 'CAD', 'Fuel purchase'),
  ('d1111111-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-29', 215.90, 'IKEA', 'Home', 'purchase', 'CAD', 'Home essentials'),
  ('d1111111-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-27', 18.99, 'Netflix', 'Subscriptions', 'purchase', 'CAD', 'Streaming'),
  ('d1111111-0000-0000-0000-000000000007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-02-04', 52.70, 'Uber', 'Transport', 'purchase', 'CAD', 'Ride share'),
  ('d1111111-0000-0000-0000-000000000008', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-02-01', 96.15, 'Air Canada', 'Travel', 'purchase', 'CAD', 'Flight booking'),
  ('d1111111-0000-0000-0000-000000000009', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-01-28', 30.00, 'Tim Hortons', 'Dining', 'purchase', 'CAD', 'Breakfast'),
  ('d1111111-0000-0000-0000-000000000010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-01-26', 22.50, 'Uber Eats', 'Dining', 'purchase', 'CAD', 'Dinner'),
  ('d1111111-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-25', 75.00, 'Best Buy', 'Electronics', 'purchase', 'CAD', 'Keyboard'),
  ('d1111111-0000-0000-0000-000000000012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-01-22', 18.20, 'Starbucks', 'Dining', 'purchase', 'CAD', 'Coffee run'),
  ('d1111111-0000-0000-0000-000000000013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-20', -45.00, 'Amazon', 'Refunds', 'refund', 'CAD', 'Returned item')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demo_payments (id, card_id, payment_date, amount, status, method, confirmation_ref)
VALUES
  ('e1111111-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-01-15', 420.00, 'posted', 'bank_transfer', 'SCOTIA-2026-0115'),
  ('e1111111-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-12', 310.00, 'posted', 'bill_pay', 'RBC-2026-0112'),
  ('e1111111-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-01-10', 120.00, 'posted', 'debit', 'AMEX-2026-0110'),
  ('e1111111-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-02-05', 250.00, 'pending', 'bank_transfer', 'SCOTIA-2026-0205')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.demo_recommendations (id, user_id, type, priority, title, message, action_required, created_at)
VALUES
  (
    'f1111111-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'alert',
    'urgent',
    'Scotiabank card due in 11 days',
    'Pay at least $75 on your Scotiabank card to avoid late fees and protect your score.',
    TRUE,
    NOW()
  ),
  (
    'f1111111-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'recommendation',
    'high',
    'Prioritize the higher APR balance',
    'Pay the RBC card first to reduce interest costs while keeping overall utilization under 30%.',
    TRUE,
    NOW()
  ),
  (
    'f1111111-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'tip',
    'medium',
    'Schedule automatic payments',
    'Set up autopay for minimums to avoid missed payments during busy months.',
    FALSE,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
