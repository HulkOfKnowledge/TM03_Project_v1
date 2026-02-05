/**
 * API Route: POST /api/credit-intelligence/recommendations
 * TODO: Get personalized payment recommendations
 * - Get authenticated user
 * - Parse request body (availableAmount, optimizationGoal)
 * - Fetch user's credit cards and data
 * - Call CreditIntelligenceService.getPaymentRecommendations
 * - Return prioritized payment strategy
 * - Include projected savings and score impact
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
        createErrorResponse('NOT_IMPLEMENTED', 'Recommendations are only enabled in demo mode'),
        { status: 501 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const availableAmount = Number(body?.availableAmount ?? 600);
    const optimizationGoal =
      body?.optimizationGoal ?? 'balanced';

    const demoData = await demoDataService.getDashboardData();

    const payload = {
      userId: demoData.user.id,
      availableAmount,
      optimizationGoal,
      cards: demoData.cards.map((card) => ({
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

    const recommendations =
      await creditIntelligenceService.getPaymentRecommendations(payload);

    return NextResponse.json(createSuccessResponse(recommendations));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An error occurred';
    console.error('[credit-intelligence-recommendations]', message);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', message),
      { status: 500 }
    );
  }
}
