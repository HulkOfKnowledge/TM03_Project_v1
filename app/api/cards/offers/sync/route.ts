import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/types/api.types';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CardOfferRow } from '@/lib/cards/offers-utils';
import {
  NERDWALLET_PROVIDER,
  collectNerdwalletSourceUrls,
  extractOfferCandidatesFromSources,
  fetchNerdwalletSourcePages,
  normalizeOfferName,
} from '@/lib/cards/nerdwallet-source';

export const dynamic = 'force-dynamic';

const FALLBACK_GRADIENTS = [
  'from-indigo-600 to-indigo-900',
  'from-blue-600 to-blue-900',
  'from-emerald-600 to-emerald-900',
  'from-rose-600 to-rose-900',
  'from-sky-600 to-sky-900',
  'from-amber-600 to-amber-900',
  'from-slate-600 to-slate-900',
] as const;

function gradientForIndex(index: number): string {
  return FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
}

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = process.env.CARD_OFFERS_SYNC_TOKEN;

  if (!expectedToken) {
    // In environments without a sync token set, keep endpoint disabled.
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authHeader.slice('Bearer '.length).trim();
  return providedToken === expectedToken;
}

async function invalidatePythonRewardCatalogCache(): Promise<boolean> {
  const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
  const pythonApiKey = process.env.CREDIT_INTELLIGENCE_API_KEY || '';

  try {
    const response = await fetch(`${pythonApiUrl}/api/v1/reward-catalog/invalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': pythonApiKey,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn('Card offers sync completed but Python cache invalidation failed', {
        status: response.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Card offers sync completed but Python cache invalidation errored', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Invalid or missing sync token'),
        { status: 401 },
      );
    }

    const supabase = createAdminClient();

    const sourceUrls = await collectNerdwalletSourceUrls();
    const sourcePages = await fetchNerdwalletSourcePages(sourceUrls);
    const sourceOffers = extractOfferCandidatesFromSources(sourcePages);

    const sourceRows = sourcePages.map((page) => ({
      provider: page.provider,
      source_url: page.sourceUrl,
      source_category: page.sourceCategory,
      source_title: page.sourceTitle,
      fetched_at: page.fetchedAt,
      status: page.status,
      http_status: page.httpStatus,
      checksum: page.checksum,
      error_message: page.errorMessage,
      updated_at: new Date().toISOString(),
    }));

    const { error: sourceUpsertError } = await supabase
      .from('credit_card_offer_sources')
      .upsert(sourceRows, { onConflict: 'provider,source_url' });

    if (sourceUpsertError) {
      console.error('Failed to upsert offer source rows:', sourceUpsertError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to store source sync records'),
        { status: 500 },
      );
    }

    const { data: offers, error: offersError } = await supabase
      .from('credit_card_offers')
      .select('id,name,issuer,is_active,display_order,apply_url,source_external_id')
      .eq('is_active', true);

    if (offersError) {
      console.error('Failed to load offers for source sync:', offersError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to load offers for sync'),
        { status: 500 },
      );
    }

    const syncedAt = new Date().toISOString();
    const existingOffers = (offers ?? []) as Array<Pick<CardOfferRow, 'id' | 'name' | 'issuer' | 'display_order' | 'apply_url' | 'source_external_id'>>;
    const existingByName = new Map<string, Pick<CardOfferRow, 'id' | 'name' | 'issuer' | 'display_order' | 'apply_url' | 'source_external_id'>>();
    const existingByExternalId = new Map<string, Pick<CardOfferRow, 'id' | 'name' | 'issuer' | 'display_order' | 'apply_url' | 'source_external_id'>>();
    for (const existing of existingOffers) {
      const key = normalizeOfferName(existing.name);
      if (key) existingByName.set(key, existing);
      if (existing.source_external_id) existingByExternalId.set(existing.source_external_id, existing);
    }

    const sourceOfferByName = new Map(sourceOffers.map((offer) => [normalizeOfferName(offer.name), offer]));
    const sourceOfferByExternalId = new Map(sourceOffers.map((offer) => [offer.externalId, offer]));

    const rowsToUpdate = existingOffers.map((offer) => {
      const sourceOffer = (offer.source_external_id
        ? sourceOfferByExternalId.get(offer.source_external_id)
        : undefined) ?? sourceOfferByName.get(normalizeOfferName(offer.name));

      return {
        id: offer.id,
        source_provider: NERDWALLET_PROVIDER,
        source_external_id: sourceOffer?.externalId ?? offer.source_external_id ?? null,
        source_url: sourceOffer?.reviewUrl ?? sourceOffer?.applyUrl ?? sourceOffer?.sourceUrl ?? null,
        source_image_url: sourceOffer?.imageUrl ?? null,
        source_categories: sourceOffer?.categories ?? [],
        source_match_count: sourceOffer ? 1 : 0,
        source_last_synced_at: syncedAt,
        apply_url: offer.apply_url ?? sourceOffer?.applyUrl ?? null,
      };
    });

    let updatedOffers = 0;

    for (const row of rowsToUpdate) {
      const { error: updateError } = await supabase
        .from('credit_card_offers')
        .update({
          source_provider: row.source_provider,
          source_external_id: row.source_external_id,
          source_url: row.source_url,
          source_image_url: row.source_image_url,
          source_categories: row.source_categories,
          source_match_count: row.source_match_count,
          source_last_synced_at: row.source_last_synced_at,
          apply_url: row.apply_url,
        })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update source fields for offer ${row.id}:`, updateError);
      } else {
        updatedOffers += 1;
      }
    }

    let insertedOffers = 0;
    const maxDisplayOrder = existingOffers.reduce((max, offer) => Math.max(max, offer.display_order ?? 0), 0);
    let nextDisplayOrder = maxDisplayOrder + 1;

    for (const sourceOffer of sourceOffers) {
      const key = normalizeOfferName(sourceOffer.name);
      if (!key) continue;

      const existingMatch = existingByExternalId.get(sourceOffer.externalId) ?? existingByName.get(key);
      if (existingMatch) continue;

      const { error: insertError } = await supabase
        .from('credit_card_offers')
        .insert({
          name: sourceOffer.name,
          issuer: sourceOffer.issuer,
          network: sourceOffer.network,
          categories: sourceOffer.categories,
          annual_fee: sourceOffer.annualFee,
          purchase_rate: sourceOffer.aprPurchase,
          cash_advance_rate: null,
          min_annual_income: null,
          min_credit_score: sourceOffer.minCreditScore,
          eligible_for_students: sourceOffer.categories.includes('student'),
          eligible_for_newcomers: sourceOffer.categories.includes('no-fee') || sourceOffer.categories.includes('secured'),
          welcome_bonus: sourceOffer.welcomeBonus,
          welcome_bonus_value: sourceOffer.signUpBonusValue,
          earn_rate_description: sourceOffer.rewardRateDescription,
          earn_rate_grocery: null,
          earn_rate_travel: null,
          earn_rate_dining: null,
          earn_rate_other: null,
          perks: sourceOffer.perks,
          insurance: [],
          card_gradient: gradientForIndex(nextDisplayOrder),
          is_featured: false,
          display_order: nextDisplayOrder,
          is_active: true,
          apply_url: sourceOffer.applyUrl,
          source_provider: NERDWALLET_PROVIDER,
          source_external_id: sourceOffer.externalId,
          source_url: sourceOffer.reviewUrl ?? sourceOffer.applyUrl ?? sourceOffer.sourceUrl,
          source_image_url: sourceOffer.imageUrl,
          source_categories: sourceOffer.categories,
          source_match_count: 1,
          source_last_synced_at: syncedAt,
        });

      if (insertError) {
        console.error(`Failed to insert source offer ${sourceOffer.name}:`, insertError);
      } else {
        insertedOffers += 1;
        existingByExternalId.set(sourceOffer.externalId, {
          id: 'inserted',
          name: sourceOffer.name,
          issuer: sourceOffer.issuer,
          display_order: nextDisplayOrder,
          apply_url: sourceOffer.applyUrl,
          source_external_id: sourceOffer.externalId,
        });
        nextDisplayOrder += 1;
      }
    }

    const successfulSources = sourcePages.filter((page) => page.status === 'success').length;
    const failedSources = sourcePages.length - successfulSources;
    const offersChanged = updatedOffers > 0 || insertedOffers > 0;
    const cacheInvalidated = offersChanged ? await invalidatePythonRewardCatalogCache() : true;

    return NextResponse.json(
      createSuccessResponse({
        provider: NERDWALLET_PROVIDER,
        sourceCount: sourcePages.length,
        successfulSources,
        failedSources,
        updatedOffers,
        insertedOffers,
        cacheInvalidated,
        totalSourceOffersParsed: sourceOffers.length,
        syncedAt,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in POST /api/cards/offers/sync:', error);

    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to sync card offers from external sources'),
      { status: 500 },
    );
  }
}
