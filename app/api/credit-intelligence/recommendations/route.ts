/**
 * API Route: POST /api/credit-intelligence/recommendations
 * Get personalized payment recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import axios from 'axios';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { cards: requestCards, availableAmount, optimizationGoal = 'balanced' } = body;

    if (!availableAmount || availableAmount <= 0) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Available amount is required'),
        { status: 400 }
      );
    }

    if (!requestCards || !Array.isArray(requestCards) || requestCards.length === 0) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Cards array is required'),
        { status: 400 }
      );
    }

    // Call Python credit intelligence service directly
    const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
    const response = await axios.post(
      `${pythonApiUrl}/api/v1/recommendations`,
      {
        user_id: user.id,
        cards: requestCards.map((card: {
          cardId: string;
          institutionName: string;
          currentBalance: number;
          creditLimit: number;
          utilizationPercentage: number;
          minimumPayment: number;
          paymentDueDate: string;
          interestRate: number;
          lastPaymentAmount: number;
          lastPaymentDate: string;
        }) => ({
          card_id: card.cardId,
          institution_name: card.institutionName,
          current_balance: card.currentBalance,
          credit_limit: card.creditLimit,
          utilization_percentage: card.utilizationPercentage,
          minimum_payment: card.minimumPayment,
          payment_due_date: card.paymentDueDate,
          interest_rate: card.interestRate,
          last_payment_amount: card.lastPaymentAmount,
          last_payment_date: card.lastPaymentDate,
        })),
        available_amount: parseFloat(availableAmount),
        optimization_goal: optimizationGoal,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CREDIT_INTELLIGENCE_API_KEY || '',
        },
        timeout: 60000,
      }
    );

    // Transform Python response to TypeScript format
    const recommendations = {
      userId: response.data.user_id,
      totalAmount: response.data.total_amount,
      recommendations: response.data.recommendations.map((rec: any) => ({
        cardId: rec.card_id,
        suggestedAmount: rec.suggested_amount,
        reasoning: rec.reasoning,
        expectedImpact: {
          interestSaved: rec.expected_impact.interest_saved,
          utilizationImprovement: rec.expected_impact.utilization_improvement,
          scoreImpactEstimate: rec.expected_impact.score_impact_estimate,
        },
        priority: rec.priority,
      })),
      strategy: response.data.strategy,
      projectedSavings: {
        monthlyInterest: response.data.projected_savings.monthly_interest,
        annualInterest: response.data.projected_savings.annual_interest,
      },
    };

    return NextResponse.json(
      createSuccessResponse(recommendations),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get recommendations'),
      { status: 500 }
    );
  }
}
