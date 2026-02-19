/**
 * API Route: POST /api/credit-intelligence/analyze
 * Request credit analysis from Python service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import axios from 'axios';

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

    // Fetch user's active credit cards with financial data
    const { data: cards, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select(`
        id,
        institution_name,
        credit_data_cache (
          current_balance,
          credit_limit,
          utilization_percentage,
          minimum_payment,
          payment_due_date,
          interest_rate,
          last_payment_amount,
          last_payment_date
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (cardsError) {
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch cards'),
        { status: 500 }
      );
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        createErrorResponse('NO_DATA', 'No active cards found'),
        { status: 404 }
      );
    }

    // Call Python credit intelligence service directly
    const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
    const response = await axios.post(
      `${pythonApiUrl}/api/v1/analyze`,
      {
        user_id: user.id,
        cards: cards.map(card => {
          const cacheData = Array.isArray(card.credit_data_cache) 
            ? card.credit_data_cache[0] 
            : card.credit_data_cache;
          
          if (!cacheData) {
            throw new Error(`No financial data found for card ${card.id}`);
          }

          return {
            card_id: card.id,
            institution_name: card.institution_name,
            current_balance: cacheData.current_balance,
            credit_limit: cacheData.credit_limit,
            utilization_percentage: cacheData.utilization_percentage,
            minimum_payment: cacheData.minimum_payment,
            payment_due_date: cacheData.payment_due_date,
            interest_rate: cacheData.interest_rate,
            last_payment_amount: cacheData.last_payment_amount,
            last_payment_date: cacheData.last_payment_date,
          };
        }),
        timestamp: new Date().toISOString(),
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
    const analysisResult = {
      userId: response.data.user_id,
      overallScore: response.data.overall_score,
      insights: response.data.insights.map((insight: any) => ({
        type: insight.type,
        priority: insight.priority,
        title: insight.title,
        message: insight.message,
        actionRequired: insight.action_required,
        metadata: insight.metadata,
      })),
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
      analysisTimestamp: response.data.analysis_timestamp,
    };

    return NextResponse.json(
      createSuccessResponse(analysisResult),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in credit analysis:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Analysis failed'),
      { status: 500 }
    );
  }
}
