-- =====================================================
-- MIGRATION: 010_add_credit_card_offers
-- Credit card offers/recommendations table
-- =====================================================

-- =====================================================
-- TABLE: credit_card_offers
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_card_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'amex')),
  categories TEXT[] NOT NULL DEFAULT '{}',
  -- e.g. 'travel','cashback','student','no-fee','rewards','secured','business'

  -- Financial
  annual_fee NUMERIC(8, 2) NOT NULL DEFAULT 0,
  purchase_rate NUMERIC(5, 2),         -- APR %
  cash_advance_rate NUMERIC(5, 2),

  -- Eligibility
  min_annual_income NUMERIC(12, 2),    -- NULL = no minimum
  min_credit_score INTEGER,            -- NULL = no minimum
  eligible_for_students BOOLEAN NOT NULL DEFAULT FALSE,
  eligible_for_newcomers BOOLEAN NOT NULL DEFAULT FALSE,

  -- Welcome bonus
  welcome_bonus TEXT,
  welcome_bonus_value NUMERIC(8, 2),   -- estimated dollar value

  -- Earn / rewards
  earn_rate_description TEXT,          -- human-readable summary
  earn_rate_grocery NUMERIC(5, 2),     -- multiplier, e.g. 2.0 = 2x points
  earn_rate_travel NUMERIC(5, 2),
  earn_rate_dining NUMERIC(5, 2),
  earn_rate_other NUMERIC(5, 2),

  -- Key perks (up to 6 short strings stored as array)
  perks TEXT[] NOT NULL DEFAULT '{}',

  -- Insurance coverage short labels
  insurance TEXT[] NOT NULL DEFAULT '{}',

  -- Display / ranking
  card_gradient TEXT NOT NULL DEFAULT 'from-gray-700 to-gray-900',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- External link
  apply_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read - offers are not user-specific
ALTER TABLE credit_card_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active card offers"
  ON credit_card_offers FOR SELECT
  USING (is_active = TRUE);

-- Index
CREATE INDEX idx_card_offers_categories ON credit_card_offers USING GIN (categories);
CREATE INDEX idx_card_offers_featured ON credit_card_offers (is_featured, display_order);

-- =====================================================
-- SEED DATA: Canadian credit cards
-- =====================================================

INSERT INTO credit_card_offers (
  name, issuer, network, categories,
  annual_fee, purchase_rate, cash_advance_rate,
  min_annual_income, min_credit_score,
  eligible_for_students, eligible_for_newcomers,
  welcome_bonus, welcome_bonus_value,
  earn_rate_description, earn_rate_grocery, earn_rate_travel, earn_rate_dining, earn_rate_other,
  perks, insurance,
  card_gradient, is_featured, display_order, apply_url
) VALUES

-- ============ TRAVEL CARDS ============
(
  'Scotiabank Passport™ Visa Infinite*', 'Scotiabank', 'visa',
  ARRAY['travel', 'rewards'],
  150.00, 20.99, 22.99,
  60000, 760,
  FALSE, FALSE,
  'Earn up to 35,000 bonus Scene+ points in your first year', 350.00,
  '3x on groceries, 2x on dining & entertainment, 1x everywhere else',
  3.0, 2.0, 2.0, 1.0,
  ARRAY[
    'No foreign transaction fees',
    'Complimentary airport lounge access (6 passes/yr)',
    'Comprehensive travel insurance',
    'Scene+ points never expire'
  ],
  ARRAY['Travel accident', 'Trip cancellation', 'Flight delay', 'Lost baggage', 'Purchase protection'],
  'from-red-700 to-red-950', TRUE, 1,
  'https://www.scotiabank.com/ca/en/personal/credit-cards/visa/passport-visa-infinite-card.html'
),
(
  'RBC Avion Visa Infinite', 'RBC Royal Bank', 'visa',
  ARRAY['travel', 'rewards'],
  120.00, 20.99, 22.99,
  60000, 760,
  FALSE, FALSE,
  'Earn 35,000 Avion points (worth up to $750 in travel) on approval', 750.00,
  '1.25x Avion points on all purchases, 2x on travel',
  1.25, 2.0, 1.25, 1.25,
  ARRAY[
    'Convert points to major airline programs (Avios, Asia Miles, etc.)',
    'Full travel insurance package',
    'Concierge service 24/7',
    'Visa Infinite benefits',
    'Points never expire'
  ],
  ARRAY['Travel medical', 'Trip cancellation', 'Car rental', 'Purchase protection', 'Extended warranty'],
  'from-blue-600 to-blue-950', TRUE, 2,
  'https://www.rbcroyalbank.com/credit-cards/avion-visa-infinite.html'
),
(
  'TD® Aeroplan® Visa Infinite* Card', 'TD Bank', 'visa',
  ARRAY['travel', 'rewards'],
  139.00, 20.99, 22.99,
  60000, 760,
  FALSE, FALSE,
  'Earn up to $1,200 in value in the first year', 1200.00,
  '1.5 Aeroplan points per $1 on Air Canada, 1x on gas & groceries, 1x elsewhere',
  1.0, 1.5, 1.0, 1.0,
  ARRAY[
    'Air Canada lounge access via Café passes',
    'First checked bag free on Air Canada',
    'Aeroplan Status Qualifying Miles',
    'Nexus application fee rebate',
    'Aeroplan points never expire'
  ],
  ARRAY['Emergency travel medical', 'Trip cancellation', 'Flight delay', 'Delayed baggage', 'Car rental'],
  'from-green-700 to-green-950', TRUE, 3,
  'https://www.td.com/ca/en/personal-banking/products/credit-cards/aeroplan/aeroplan-visa-infinite-card'
),
(
  'BMO eclipse Visa Infinite* Card', 'BMO Bank of Montreal', 'visa',
  ARRAY['travel', 'rewards'],
  120.00, 20.99, 23.99,
  60000, 725,
  FALSE, FALSE,
  'Earn up to 60,000 BMO Rewards points in Year 1', 400.00,
  '5x points on groceries, dining & transit; 4x on streaming; 1x everywhere',
  5.0, 1.0, 5.0, 1.0,
  ARRAY[
    '$50 lifestyle credit annually',
    'Add authorized user for free',
    'Complimentary lounge access program',
    'BMO Rewards redeem for travel, merchandise, gift cards',
    'Contactless payments'
  ],
  ARRAY['Extended warranty', 'Purchase protection', 'Travel accident', 'Car rental collision'],
  'from-sky-500 to-sky-800', FALSE, 4,
  'https://www.bmo.com/en-ca/credit-cards/eclipse-visa-infinite/'
),
(
  'HSBC World Elite® Mastercard®', 'HSBC Bank Canada', 'mastercard',
  ARRAY['travel', 'rewards'],
  149.00, 19.99, 22.99,
  80000, 760,
  FALSE, FALSE,
  'Earn up to 100,000 bonus points in Year 1', 500.00,
  '6 points per $1 on travel purchases; 3 points per $1 everywhere else',
  1.0, 6.0, 3.0, 3.0,
  ARRAY[
    'No foreign transaction fees',
    'LoungeKey™ airport lounge membership',
    'Global TSA PreCheck / NEXUS credit',
    'Transfer points to airline & hotel programs',
    'Up to $100 annual travel enhancement credit'
  ],
  ARRAY['Medical', 'Trip cancellation', 'Delayed baggage', 'Car rental', 'Purchase protection'],
  'from-red-500 to-red-900', FALSE, 5,
  'https://www.hsbc.ca/credit-cards/world-elite/'
),

-- ============ CASHBACK CARDS ============
(
  'Tangerine Money-Back Credit Card', 'Tangerine Bank', 'mastercard',
  ARRAY['cashback', 'no-fee'],
  0.00, 19.95, 19.95,
  NULL, 660,
  FALSE, TRUE,
  '15% cash back on all purchases in first 2 months (up to $300 cash back)', 300.00,
  '2% cash back in up to 3 categories of your choice, 0.5% on everything else',
  2.0, 2.0, 2.0, 0.5,
  ARRAY[
    'Choose your own 2% categories (grocery, gas, dining, etc.)',
    'Cash back paid monthly to your account',
    'No annual fee — ever',
    'Unlimited 0.5% back on all other purchases',
    'Easy online account management'
  ],
  ARRAY['Purchase protection', 'Extended warranty'],
  'from-orange-500 to-orange-800', TRUE, 6,
  'https://www.tangerine.ca/en/products/spending/creditcard/money-back/'
),
(
  'Simplii Financial™ Cash Back Visa* Card', 'Simplii Financial', 'visa',
  ARRAY['cashback', 'no-fee'],
  0.00, 19.99, 22.99,
  NULL, 660,
  FALSE, TRUE,
  '10% cash back for first 3 months (up to $500 cash back)', 500.00,
  '4% on restaurants & bars; 1.5% on grocery & gas; 0.5% everywhere',
  1.5, 0.5, 4.0, 0.5,
  ARRAY[
    'No annual fee',
    'Cash back deposited annually to account',
    'Instant purchase notifications',
    'Up to $50,000 cash back annually',
    'Free supplementary cards'
  ],
  ARRAY['Purchase protection', 'Extended warranty', 'Car rental collision'],
  'from-indigo-500 to-indigo-800', FALSE, 7,
  'https://www.simplii.com/en/banking-products/credit-cards/cash-back.html'
),
(
  'CIBC Dividend® Visa Infinite* Card', 'CIBC', 'visa',
  ARRAY['cashback', 'rewards'],
  120.00, 20.99, 22.99,
  60000, 725,
  FALSE, FALSE,
  'Earn 10% cash back for the first 4 statements (up to $200)', 200.00,
  '4% on gas & EV charging; 3% on groceries; 2% on dining & transport; 1% elsewhere',
  3.0, 1.0, 2.0, 1.0,
  ARRAY[
    'Highest grocery earn rate for annual-fee cards',
    'No limit on cash back earned',
    'Redeem any time for any amount',
    'Visa Infinite concierge & perks',
    'CIBC MyAccount management app'
  ],
  ARRAY['Mobile device insurance', 'Purchase protection', 'Extended warranty', 'Car rental collision'],
  'from-rose-600 to-rose-900', FALSE, 8,
  'https://www.cibc.com/en/personal-banking/credit-cards/cashback/dividend-visa-infinite.html'
),
(
  'PC Financial® World Elite® Mastercard®', 'President''s Choice Financial', 'mastercard',
  ARRAY['cashback', 'rewards', 'no-fee'],
  0.00, 19.97, 22.97,
  80000, 725,
  FALSE, FALSE,
  'Earn 10,000 PC Optimum points on first purchase', 100.00,
  '45 PC Optimum points per $1 at Loblaws; 30 per $1 at Shoppers Drug Mart; 10 per $1 everywhere',
  45.0, 10.0, 10.0, 10.0,
  ARRAY[
    'No annual fee with $80,000+ income',
    'Best for Loblaws / Shoppers shoppers',
    'Points redeemable for free groceries',
    'World Elite travel benefits',
    'Boingo Wi-Fi access worldwide'
  ],
  ARRAY['Travel accident', 'Car rental collision', 'Purchase protection', 'Extended warranty'],
  'from-amber-600 to-amber-900', FALSE, 9,
  'https://www.pcfinancial.ca/en/credit-cards/world-elite/'
),
(
  'BMO CashBack® Mastercard®', 'BMO Bank of Montreal', 'mastercard',
  ARRAY['cashback', 'no-fee'],
  0.00, 19.99, 22.99,
  NULL, 660,
  FALSE, TRUE,
  '5% cash back for first 3 months on all purchases', 150.00,
  '3% on groceries; 1% on recurring bills; 0.5% on everything else',
  3.0, 0.5, 0.5, 0.5,
  ARRAY[
    'No annual fee',
    'Best base cash back rate for no-fee cards',
    'Redeem any time — no minimum',
    'Zero liability fraud protection',
    'BMO Mobile Banking app'
  ],
  ARRAY['Purchase protection', 'Extended warranty'],
  'from-sky-600 to-sky-900', FALSE, 10,
  'https://www.bmo.com/en-ca/credit-cards/cashback-mastercard/'
),

-- ============ STUDENT CARDS ============
(
  'TD® Student Visa* Card', 'TD Bank', 'visa',
  ARRAY['student', 'no-fee'],
  0.00, 19.99, 22.99,
  NULL, NULL,
  TRUE, FALSE,
  NULL, NULL,
  '0.5% cash back on all purchases via TD Rewards',
  0.5, 0.5, 0.5, 0.5,
  ARRAY[
    'No annual fee for students',
    'No income requirement for full-time students',
    'Build credit history from day one',
    'Free supplementary cards',
    'TD mobile banking integration'
  ],
  ARRAY['Purchase protection', 'Extended warranty'],
  'from-emerald-500 to-emerald-800', FALSE, 11,
  'https://www.td.com/ca/en/personal-banking/products/credit-cards/cash-back/student-visa-card'
),
(
  'Scotia SCENE+™ Visa* Card', 'Scotiabank', 'visa',
  ARRAY['student', 'rewards'],
  0.00, 19.99, 22.99,
  NULL, NULL,
  TRUE, FALSE,
  'Earn 5,000 Scene+ points when you make your first purchase in first 3 months', 50.00,
  '2x Scene+ points on dining, groceries & entertainment; 1x on everything else',
  2.0, 1.0, 2.0, 1.0,
  ARRAY[
    'No annual fee',
    'Redeem points for free movies at Cineplex',
    'Points for Sobeys, IGA, FreshCo & more',
    'Perfect first credit card',
    'Digital wallet support'
  ],
  ARRAY['Purchase protection'],
  'from-red-600 to-red-900', FALSE, 12,
  'https://www.scotiabank.com/ca/en/personal/credit-cards/visa/scene-visa-card.html'
),
(
  'RBC ION+ Visa Card', 'RBC Royal Bank', 'visa',
  ARRAY['student', 'rewards'],
  0.00, 20.99, 22.99,
  NULL, NULL,
  TRUE, FALSE,
  'Earn 3,500 bonus Avion Rewards points when you get the card', 35.00,
  '3x Avion Rewards on groceries, streaming & subscription services; 1x elsewhere',
  3.0, 1.0, 1.0, 1.0,
  ARRAY[
    'No annual fee',
    'Great for students building credit',
    'Earn points on streaming (Netflix, Spotify, etc.)',
    'Digital wallet compatible',
    'RBC mobile app with spending insights'
  ],
  ARRAY['Purchase protection', 'Extended warranty'],
  'from-violet-500 to-violet-800', FALSE, 13,
  'https://www.rbcroyalbank.com/credit-cards/ion-plus-visa-card.html'
),
(
  'CIBC Liquid™ Visa* Card', 'CIBC', 'visa',
  ARRAY['student', 'cashback'],
  0.00, 19.99, 22.99,
  NULL, NULL,
  TRUE, FALSE,
  NULL, NULL,
  '2% cash back on recurring bills; 1% on everything else',
  1.0, 1.0, 1.0, 1.0,
  ARRAY[
    'No annual fee',
    'Best recurring bill earn rate for students',
    'Cash back deposited annually',
    'Visa payWave contactless',
    'CIBC Online Banking access'
  ],
  ARRAY['Purchase protection'],
  'from-pink-500 to-pink-800', FALSE, 14,
  'https://www.cibc.com/en/personal-banking/credit-cards/cashback/liquid-visa.html'
),

-- ============ NO-FEE REWARDS ============
(
  'American Express® Green Card', 'American Express', 'amex',
  ARRAY['rewards', 'no-fee'],
  0.00, 20.99, 21.99,
  NULL, 660,
  FALSE, TRUE,
  'Earn 10,000 Membership Rewards points on first purchase', 100.00,
  '1x Membership Rewards point on all purchases',
  1.0, 1.0, 1.0, 1.0,
  ARRAY[
    'No annual fee',
    'Points transferable to Aeroplan, Avios, etc.',
    'Access to Amex Experiences & pre-sales',
    'Shop Small® offers',
    'Amex SafeKey® purchase protection'
  ],
  ARRAY['Purchase protection', 'Extended warranty'],
  'from-lime-600 to-lime-900', FALSE, 15,
  'https://www.americanexpress.com/en-ca/credit-cards/green-card/'
),
(
  'Desjardins Cash Back Visa* Card', 'Desjardins', 'visa',
  ARRAY['cashback', 'no-fee'],
  0.00, 19.90, 19.90,
  NULL, 640,
  FALSE, TRUE,
  NULL, NULL,
  '2% cash back on groceries & gas; 1% on everything else',
  2.0, 1.0, 1.0, 1.0,
  ARRAY[
    'No annual fee',
    'Competitive grocery and gas earn rate',
    'Cash back applied directly to card balance',
    'Contactless payments',
    'AccèsD online banking integration'
  ],
  ARRAY['Purchase protection', 'Extended warranty'],
  'from-teal-500 to-teal-800', FALSE, 16,
  'https://www.desjardins.com/ca/personal/accounts-services/credit-cards/visa-cash-back.html'
),

-- ============ SECURED / CREDIT BUILDER ============
(
  'Capital One® Guaranteed Mastercard®', 'Capital One', 'mastercard',
  ARRAY['secured', 'no-fee'],
  59.00, 19.80, 21.90,
  NULL, NULL,
  FALSE, TRUE,
  NULL, NULL,
  'Guaranteed approval — no credit check required',
  0.0, 0.0, 0.0, 0.0,
  ARRAY[
    'Guaranteed approval with no credit check',
    'Great for newcomers & credit rebuilding',
    'Reports to both Equifax and TransUnion',
    'Refundable security deposit sets your limit',
    'Upgrade path to unsecured card after 12 months'
  ],
  ARRAY['Purchase protection'],
  'from-gray-500 to-gray-800', FALSE, 17,
  'https://www.capitalone.ca/credit-cards/guaranteed-mastercard/'
),
(
  'Home Trust Secured Visa Card', 'Home Trust', 'visa',
  ARRAY['secured'],
  0.00, 19.99, 19.99,
  NULL, NULL,
  FALSE, TRUE,
  NULL, NULL,
  'Build credit with a secured deposit',
  0.0, 0.0, 0.0, 0.0,
  ARRAY[
    'No annual fee option available',
    'Approved for any credit profile',
    'Builds credit history fast',
    'Security deposit from $500 to $10,000',
    'Accepted worldwide'
  ],
  ARRAY['Purchase protection'],
  'from-stone-500 to-stone-800', FALSE, 18,
  'https://www.hometrust.ca/credit-cards/secured-visa/'
),
(
  'Refresh Financial® Secured Visa®', 'Refresh Financial', 'visa',
  ARRAY['secured'],
  12.95, 17.99, 21.99,
  NULL, NULL,
  FALSE, TRUE,
  NULL, NULL,
  'Designed specifically for credit building in Canada',
  0.0, 0.0, 0.0, 0.0,
  ARRAY[
    'Low fixed interest rate at 17.99%',
    'Credit building reports monthly',
    'Credit score monitoring included',
    'Instant approval decision',
    'Upgrade to unsecured in as little as 12 months'
  ],
  ARRAY['Purchase protection'],
  'from-cyan-500 to-cyan-800', FALSE, 19,
  'https://www.refreshfinancial.ca/credit-cards/'
),

-- ============ PREMIUM / HIGH-INCOME ============
(
  'American Express® Cobalt™ Card', 'American Express', 'amex',
  ARRAY['travel', 'rewards', 'cashback'],
  155.88, 20.99, 21.99,
  NULL, 725,
  FALSE, FALSE,
  'Earn up to 30,000 Membership Rewards points as a welcome bonus', 300.00,
  '5x points on eats & drinks; 3x on streaming; 2x on travel & transit; 1x everywhere',
  5.0, 2.0, 5.0, 1.0,
  ARRAY[
    'Best earn rate on food & restaurants in Canada',
    'Monthly fee instead of annual ($12.99/mo)',
    'Points transfer to Aeroplan, Avios, etc.',
    'Amex Front Of The Line® presale access',
    '$100 USD hotel credit on Amex Travel bookings'
  ],
  ARRAY['Emergency travel medical', 'Trip interruption', 'Car rental theft & damage', 'Purchase protection', 'Extended warranty'],
  'from-yellow-500 to-yellow-700', TRUE, 20,
  'https://www.americanexpress.com/en-ca/credit-cards/cobalt-card/'
),
(
  'National Bank World Elite® Mastercard®', 'National Bank', 'mastercard',
  ARRAY['travel', 'rewards'],
  150.00, 20.99, 22.99,
  80000, 760,
  FALSE, FALSE,
  'Earn 40,000 bonus À la carte Rewards® points on approval', 400.00,
  '5x À la carte Rewards on dining & groceries; 2x on travel; 1x everywhere',
  5.0, 2.0, 5.0, 1.0,
  ARRAY[
    '$150 annual travel credit',
    'Comprehensive insurance package (12 types)',
    'Airport lounge access (DragonPass)',
    'Travel health insurance for 60 days per trip',
    'Concierge service'
  ],
  ARRAY['Emergency travel medical (60 days)', 'Trip cancellation', 'Flight delay', 'Baggage', 'Purchase protection', 'Extended warranty'],
  'from-red-800 to-red-950', FALSE, 21,
  'https://www.nbc.ca/personal/credit-cards/world-elite-mastercard.html'
),
(
  'Desjardins Odyssey Visa Infinite* Card', 'Desjardins', 'visa',
  ARRAY['travel', 'rewards', 'cashback'],
  130.00, 19.90, 19.90,
  50000, 725,
  FALSE, FALSE,
  '15,000 bonus DOLLAR$ on first purchase', 150.00,
  '3.5% DOLLAR$ on dining, groceries & fuel; 1.5% on everything else',
  3.5, 1.5, 3.5, 1.5,
  ARRAY[
    'DOLLAR$ = 1 cent each, simple redemption',
    'Platinum insurance coverage',
    'Priority Pass lounge membership',
    'DOLLAR$ deposited monthly',
    'No foreign transaction fees'
  ],
  ARRAY['Emergency travel medical', 'Trip cancellation', 'Car rental', 'Purchase protection', 'Extended warranty'],
  'from-green-600 to-green-900', FALSE, 22,
  'https://www.desjardins.com/ca/personal/accounts-services/credit-cards/visa-infinite-odyssey/'
);
