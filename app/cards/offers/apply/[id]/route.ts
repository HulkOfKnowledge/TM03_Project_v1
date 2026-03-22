import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function resolveFinalApplyUrl(rawUrl: string): Promise<string> {
  try {
    const parsed = new URL(rawUrl);
    const isNerdwalletRedirect = parsed.hostname.includes('nerdwallet.com') && parsed.pathname.startsWith('/redirect/');

    if (!isNerdwalletRedirect) {
      return rawUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(rawUrl, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CredumanPrototype/1.0',
        },
      });

      if (response.url && response.url !== rawUrl) {
        return response.url;
      }

      return rawUrl;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return rawUrl;
  }
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const fallbackUrl = new URL('/cards/offers', request.url);
    const offerId = context.params.id;
    if (!offerId) {
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = await createClient();
    const { data: offer, error } = await supabase
      .from('credit_card_offers')
      .select('apply_url')
      .eq('id', offerId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !offer?.apply_url) {
      return NextResponse.redirect(fallbackUrl);
    }

    const destination = await resolveFinalApplyUrl(offer.apply_url);
    return NextResponse.redirect(destination, { status: 302 });
  } catch {
    return NextResponse.redirect(new URL('/cards/offers', request.url));
  }
}
