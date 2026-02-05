/**
 * API Route: POST /api/credit-intelligence/analyze
 * TODO: Request credit analysis from Python service
 * - Get authenticated user
 * - Fetch all active credit cards for user
 * - Fetch latest credit data for each card
 * - Prepare CreditDataPayload
 * - Call CreditIntelligenceService.analyzeCredit
 * - Store insights in credit_insights table
 * - Return analysis results
 * - Handle async processing if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { creditIntelligenceService } from '@/services/credit-intelligence.service';
import { demoDataService } from '@/services/demo-data.service';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (!isDemoMode) {
      return NextResponse.json(
        createErrorResponse('NOT_IMPLEMENTED', 'Credit analysis is only enabled in demo mode'),
        { status: 501 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const connectedCardIds = body?.connectedCardIds ?? [];

    const demoData = await demoDataService.getDashboardData();

    // Filter cards based on connectedCardIds
    const filteredCards = connectedCardIds.length > 0
      ? demoData.cards.filter(card => connectedCardIds.includes(card.id))
      : demoData.cards;

    const payload = {
      userId: demoData.user.id,
      timestamp: new Date().toISOString(),
      cards: filteredCards.map((card) => ({
        cardId: card.id,
        institutionName: card.institution_name,
        currentBalance: card.current_balance,
        creditLimit: card.credit_limit,
        utilizationPercentage: card.utilization_percentage,
        minimumPayment: card.minimum_payment,
        paymentDueDate: card.payment_due_date,
        interestRate: card.interest_rate,
        lastPaymentAmount: null,
        lastPaymentDate: null,
      })),
    };

    console.log('[credit-intelligence-analyze] payload', {
      userId: payload.userId,
      timestamp: payload.timestamp,
      cardsCount: payload.cards.length,
      cardIds: payload.cards.map((card) => card.cardId),
    });

    const analysis = await creditIntelligenceService.analyzeCredit(payload);

    return NextResponse.json(createSuccessResponse(analysis));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An error occurred';
    console.error('[credit-intelligence-analyze]', message);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', message),
      { status: 500 }
    );
  }
}
