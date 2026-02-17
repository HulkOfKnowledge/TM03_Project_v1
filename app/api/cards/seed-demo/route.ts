/**
 * API Route: /api/cards/seed-demo
 * Seeds database with demo cards and historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

// Demo card configurations
const DEMO_CARDS = [
  { name: 'Visa Platinum', bank: 'TD Bank', type: 'visa', lastFour: '5168' },
  { name: 'World Elite', bank: 'RBC', type: 'mastercard', lastFour: '4892' },
  { name: 'Cash Back', bank: 'Scotiabank', type: 'visa', lastFour: '7234' },
  { name: 'Travel Rewards', bank: 'BMO', type: 'visa', lastFour: '3456' },
  { name: 'Gold Card', bank: 'CIBC', type: 'mastercard', lastFour: '8901' },
  { name: 'Student Card', bank: 'Tangerine', type: 'mastercard', lastFour: '2345' },
  { name: 'Secured Card', bank: 'Capital One', type: 'visa', lastFour: '6789' },
  { name: 'Premium Travel', bank: 'Amex', type: 'visa', lastFour: '1234' },
  { name: 'No Fee Card', bank: 'PC Financial', type: 'mastercard', lastFour: '5678' },
  { name: 'Cashback Plus', bank: 'Simplii', type: 'visa', lastFour: '9012' },
];

/**
 * Generate deterministic random number based on seed
 */
function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const random = x - Math.floor(x);
  return Math.floor(random * (max - min + 1)) + min;
}

/**
 * Generate credit data for a card
 */
function generateCreditData(cardIndex: number, monthsAgo: number = 0) {
  const baseSeed = cardIndex * 1000 + monthsAgo;
  
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

    const createdCards = [];
    const now = new Date();

    // Create each demo card
    for (let i = 0; i < DEMO_CARDS.length; i++) {
      const card = DEMO_CARDS[i];
      
      // Insert card (initially inactive - user will select which to "connect" via modal)
      const { data: newCard, error: cardError } = await supabase
        .from('connected_credit_cards')
        .insert({
          user_id: user.id,
          flinks_login_id: `demo_login_${i}`,
          flinks_account_id: `demo_account_${i}`,
          institution_name: card.bank,
          card_type: 'credit',
          card_last_four: card.lastFour,
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
        const creditData = generateCreditData(i, monthsAgo);
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
        lastFour: card.lastFour,
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
