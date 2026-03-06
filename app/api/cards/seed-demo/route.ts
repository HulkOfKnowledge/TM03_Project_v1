/**
 * API Route: /api/cards/seed-demo
 * Seeds database with demo cards and historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

// Demo card template — financial values are personalised per user at seed time
const DEMO_CARDS = [
  { name: 'Visa Platinum',   bank: 'TD Bank',      type: 'visa',       network: 'td bank' },
  { name: 'World Elite',     bank: 'RBC',          type: 'mastercard', network: 'rbc' },
  { name: 'Cash Back',       bank: 'Scotiabank',   type: 'visa',       network: 'scotiabank' },
  { name: 'Travel Rewards',  bank: 'BMO',          type: 'visa',       network: 'bmo' },
  { name: 'Gold Card',       bank: 'CIBC',         type: 'mastercard', network: 'cibc' },
  { name: 'Student Card',    bank: 'Tangerine',    type: 'mastercard', network: 'tangerine' },
  { name: 'Secured Card',    bank: 'Capital One',  type: 'visa',       network: 'capital one' },
  { name: 'Premium Travel',  bank: 'Amex',         type: 'visa',       network: 'amex' },
  { name: 'No Fee Card',     bank: 'PC Financial', type: 'mastercard', network: 'pc financial' },
  { name: 'Cashback Plus',   bank: 'Simplii',      type: 'visa',       network: 'simplii' },
];

/**
 * Hash a user UUID to a stable numeric seed so each user gets different demo data
 */
function hashUserId(userId: string): number {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char;
    hash = hash & hash; // keep 32-bit
  }
  return Math.abs(hash);
}

/**
 * Generate a user+card-specific last-four string
 */
function generateLastFour(userSeed: number, cardIndex: number): string {
  const seed = userSeed + cardIndex * 7919; // prime multiplier for spread
  const x = Math.sin(seed) * 10000;
  const val = 1000 + Math.floor((x - Math.floor(x)) * 9000);
  return val.toString();
}

/**
 * Generate deterministic random number based on seed
 */
function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const random = x - Math.floor(x);
  return Math.floor(random * (max - min + 1)) + min;
}

/**
 * Generate credit data for a card, personalised by userSeed
 */
function generateCreditData(userSeed: number, cardIndex: number, monthsAgo: number = 0) {
  const baseSeed = userSeed + cardIndex * 1000 + monthsAgo;
  
  const creditLimit = seededRandom(baseSeed, 2000, 10000);
  const utilizationBase = seededRandom(baseSeed + 1, 15, 65);
  
  // Add variation over time
  const timeVariation = Math.sin(monthsAgo * 0.5) * 10;
  const utilization = Math.max(10, Math.min(70, utilizationBase + timeVariation));
  
  const currentBalance = Math.floor((creditLimit * utilization) / 100);
  const availableCredit = creditLimit - currentBalance;
  const minimumPayment = Math.floor(currentBalance * 0.03);
  const lastPaymentAmount = seededRandom(baseSeed + 2, 100, 500);
  const interestRate = seededRandom(baseSeed + 3, 1500, 2500) / 100;
  
  return {
    currentBalance,
    creditLimit,
    availableCredit,
    utilizationPercentage: parseFloat(utilization.toFixed(2)),
    minimumPayment,
    lastPaymentAmount,
    interestRate,
  };
}

/**
 * POST /api/cards/seed-demo
 * Seed database with demo cards and historical data
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Idempotency: skip if user already has demo cards
    const { count } = await supabase
      .from('connected_credit_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .like('flinks_account_id', 'demo_account_%');

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        createSuccessResponse({ message: 'Demo cards already seeded for this user', cards: [] }),
        { status: 200 }
      );
    }

    // Derive a stable numeric seed from this user's ID so their data is unique
    const userSeed = hashUserId(user.id);

    const createdCards = [];
    const now = new Date();

    // Create each demo card
    for (let i = 0; i < DEMO_CARDS.length; i++) {
      const card = DEMO_CARDS[i];
      const lastFour = generateLastFour(userSeed, i);
      
      // Insert card (initially inactive - user will select which to "connect" via modal)
      const { data: newCard, error: cardError } = await supabase
        .from('connected_credit_cards')
        .insert({
          user_id: user.id,
          flinks_login_id: `demo_login_${i}`,
          flinks_account_id: `demo_account_${i}`,
          institution_name: card.bank,
          card_type: 'credit',
          card_last_four: lastFour,
          card_network: card.type,
          is_active: false, // Start as inactive
          last_synced_at: now.toISOString(),
        })
        .select()
        .single();

      if (cardError) {
        console.error(`Error creating card ${i}:`, cardError);
        continue;
      }

      // Generate 12 months of historical data
      const creditDataEntries = [];
      for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
        const creditData = generateCreditData(userSeed, i, monthsAgo);
        const syncDate = new Date(now);
        syncDate.setMonth(syncDate.getMonth() - monthsAgo);
        
        // Calculate payment due date (15 days from sync date)
        const dueDate = new Date(syncDate);
        dueDate.setDate(dueDate.getDate() + 15);
        
        // Calculate last payment date (30 days before sync)
        const paymentDate = new Date(syncDate);
        paymentDate.setDate(paymentDate.getDate() - 30);

        creditDataEntries.push({
          card_id: newCard.id,
          current_balance: creditData.currentBalance,
          credit_limit: creditData.creditLimit,
          available_credit: creditData.availableCredit,
          utilization_percentage: creditData.utilizationPercentage,
          minimum_payment: creditData.minimumPayment,
          payment_due_date: dueDate.toISOString(),
          last_payment_amount: creditData.lastPaymentAmount,
          last_payment_date: paymentDate.toISOString(),
          interest_rate: creditData.interestRate,
          synced_at: syncDate.toISOString(),
          raw_flinks_data: {},
        });
      }

      // Insert all credit data entries for this card
      const { error: dataError } = await supabase
        .from('credit_data_cache')
        .insert(creditDataEntries);

      if (dataError) {
        console.error(`Error creating credit data for card ${i}:`, dataError);
      }

      createdCards.push({
        id: newCard.id,
        name: `${card.bank} ${card.name}`,
        bank: card.bank,
        type: card.type,
        lastFour,
      });
    }

    return NextResponse.json(
      createSuccessResponse({
        message: `Successfully seeded ${createdCards.length} demo cards with 12 months of history each`,
        cards: createdCards,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/cards/seed-demo:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cards/seed-demo
 * Remove all demo data for the user
 */
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Delete all cards (cascade will delete credit_data_cache)
    const { error: deleteError } = await supabase
      .from('connected_credit_cards')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting cards:', deleteError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to delete cards'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ message: 'All demo data deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/cards/seed-demo:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
