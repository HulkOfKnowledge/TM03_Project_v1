import { createHash } from 'crypto';
import type { CardCategory } from '@/types/card-offers.types';

export const NERDWALLET_PROVIDER = 'nerdwallet';
export const NERDWALLET_HUB_URL = 'https://www.nerdwallet.com/ca/h/credit-cards';

const FALLBACK_SOURCE_URLS = [
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-credit-cards-in-canada',
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-cash-back-credit-cards',
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-travel-credit-cards',
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-general-rewards-credit-cards',
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-student-credit-cards',
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-credit-cards-for-newcomers-to-canada',
  'https://www.nerdwallet.com/ca/p/best/credit-cards/best-secured-credit-cards',
] as const;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

export interface NerdwalletSourcePage {
  provider: typeof NERDWALLET_PROVIDER;
  sourceUrl: string;
  sourceCategory: CardCategory | 'all';
  sourceTitle: string | null;
  fetchedAt: string;
  status: 'success' | 'failed';
  httpStatus: number | null;
  checksum: string | null;
  errorMessage: string | null;
  searchText: string;
  rawHtml: string;
}

export interface NerdwalletOfferCandidate {
  externalId: string;
  name: string;
  issuer: string;
  network: 'visa' | 'mastercard' | 'amex';
  applyUrl: string | null;
  reviewUrl: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  categories: CardCategory[];
  annualFee: number;
  aprPurchase: number | null;
  signUpBonusValue: number | null;
  welcomeBonus: string | null;
  rewardRateDescription: string | null;
  perks: string[];
  minCreditScore: number | null;
}

function toAbsoluteUrl(baseUrl: string, href: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function stripHtmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');

  return withoutScripts.replace(/\s+/g, ' ').trim();
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  return match[1].replace(/\s+/g, ' ').trim();
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeOfferName(value: string): string {
  return normalizeSearchText(value)
    .replace(/\b(card|credit|visa|mastercard|amex|american express)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEscapedJsonText(value: string): string {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"')
    .replace(/\\n|\\r|\\t/g, ' ')
    .trim();
}

function parseNumericToken(token: string | undefined): number | null {
  if (!token) return null;
  const cleaned = token.replace(/\$undefined/g, '').replace(/["$]/g, '').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStringArrayFromLiteral(literal: string | undefined): string[] {
  if (!literal) return [];
  const result: string[] = [];
  const regex = /"([^"]+)"/g;
  let match = regex.exec(literal);
  while (match !== null) {
    result.push(decodeEscapedJsonText(match[1]));
    match = regex.exec(literal);
  }
  return result;
}

function extractSourceExternalId(reviewUrl: string | null, applyUrl: string | null, name: string): string {
  const candidateUrls = [reviewUrl, applyUrl].filter((value): value is string => Boolean(value));
  const idPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

  for (const url of candidateUrls) {
    const match = url.match(idPattern);
    if (match) return match[0].toLowerCase();
  }

  return normalizeOfferName(name);
}

function inferNetwork(name: string): 'visa' | 'mastercard' | 'amex' {
  const normalized = name.toLowerCase();
  if (normalized.includes('mastercard')) return 'mastercard';
  if (normalized.includes('american express') || normalized.includes('amex')) return 'amex';
  return 'visa';
}

function inferIssuer(name: string): string {
  const issuerPatterns: Array<{ issuer: string; test: RegExp }> = [
    { issuer: 'Scotiabank', test: /scotia/i },
    { issuer: 'RBC Royal Bank', test: /rbc|royal bank/i },
    { issuer: 'TD Bank', test: /\btd\b|toronto-dominion/i },
    { issuer: 'CIBC', test: /\bcibc\b/i },
    { issuer: 'BMO Bank of Montreal', test: /\bbmo\b|bank of montreal/i },
    { issuer: 'American Express', test: /american express|amex/i },
    { issuer: 'Tangerine Bank', test: /tangerine/i },
    { issuer: 'Simplii Financial', test: /simplii/i },
    { issuer: 'Capital One', test: /capital one/i },
    { issuer: 'MBNA', test: /\bmbna\b/i },
    { issuer: 'National Bank', test: /national bank/i },
    { issuer: 'HSBC', test: /\bhsbc\b/i },
    { issuer: 'Desjardins', test: /desjardins/i },
    { issuer: 'PC Financial', test: /pc financial|president'?s choice/i },
    { issuer: 'Neo Financial', test: /\bneo\b/i },
  ];

  for (const pattern of issuerPatterns) {
    if (pattern.test.test(name)) return pattern.issuer;
  }

  const firstChunk = name.split(' ')[0];
  return firstChunk ? `${firstChunk} Bank` : 'Unknown Issuer';
}

function mapCategoriesFromSource(sourceCategory: CardCategory | 'all', rawCategories: string[]): CardCategory[] {
  const mapped = new Set<CardCategory>();

  if (sourceCategory !== 'all') {
    mapped.add(sourceCategory);
  }

  for (const item of rawCategories.map((value) => value.toLowerCase())) {
    if (item.includes('cash back')) mapped.add('cashback');
    if (item.includes('travel')) mapped.add('travel');
    if (item.includes('student')) mapped.add('student');
    if (item.includes('secured') || item.includes('bad credit')) mapped.add('secured');
    if (item.includes('no fee') || item.includes('no-fee')) mapped.add('no-fee');
    if (item.includes('rewards') || item.includes('points')) mapped.add('rewards');
  }

  if (mapped.size === 0) {
    mapped.add('rewards');
  }

  return Array.from(mapped);
}

function uniqueValues<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function extractOfferCandidatesFromSourcePage(page: NerdwalletSourcePage): NerdwalletOfferCandidate[] {
  if (page.status !== 'success' || page.rawHtml.length === 0) return [];

  const decodedHtml = decodeEscapedJsonText(page.rawHtml);
  const rowRegexes = [
    /"name":"([^"]+)","entityType":"offers"([\s\S]*?)"driverAnnualFee"/g,
    /\\"name\\":\\"([^\\"]+)\\",\\"entityType\\":\\"offers\\"([\s\S]*?)\\"driverAnnualFee\\"/g,
  ];

  const candidates: NerdwalletOfferCandidate[] = [];
  const scanTargets = [decodedHtml, page.rawHtml];

  for (const scanTarget of scanTargets) {
    for (const rowRegex of rowRegexes) {
      rowRegex.lastIndex = 0;
      let rowMatch = rowRegex.exec(scanTarget);

      while (rowMatch !== null) {
        const name = decodeEscapedJsonText(rowMatch[1]);
        const rowBody = decodeEscapedJsonText(rowMatch[2] ?? '');

        const ctaMatch = rowBody.match(/"cta":\{"link":"([^"]+)"/);
        const imageMatch = rowBody.match(/"image":\{"alt":"[^"]*","source":"([^"]+)"\}/);
        const reviewMatch = rowBody.match(/"reviewLink":"([^"]+)"/);
        const feeMatch = rowBody.match(/"feeAnnual":([^,}\]]+)/);
        const aprMatch = rowBody.match(/"aprPurchase":([^,}\]]+)/);
        const signUpValueMatch = rowBody.match(/"signUpBonus":([^,}\]]+)/);
        const signUpTextMatch = rowBody.match(/"driverSignUpBonus"[\s\S]*?"value":"([^"]+)"/);
        const rewardsMatch = rowBody.match(/"driverRewardsRate"[\s\S]*?"valueTooltip":"([^"]+)"/);
        const perksMatch = rowBody.match(/"marketingBullets":\[([\s\S]*?)\],"starRating"/);
        const categoriesMatch = rowBody.match(/"categories":\[([\s\S]*?)\],"aprPurchase"/);
        const creditScoreMinMatch = rowBody.match(/"creditScoreMin":([^,}\]]+)/);

        const rawCategories = parseStringArrayFromLiteral(categoriesMatch?.[1]);
        const perks = uniqueValues(parseStringArrayFromLiteral(perksMatch?.[1])).slice(0, 6);
        const categoryValues = mapCategoriesFromSource(page.sourceCategory, rawCategories);
        const applyUrl = ctaMatch?.[1] ? decodeEscapedJsonText(ctaMatch[1]) : null;
        const reviewUrl = reviewMatch?.[1] && reviewMatch[1] !== '$undefined' ? decodeEscapedJsonText(reviewMatch[1]) : null;
        const externalId = extractSourceExternalId(reviewUrl, applyUrl, name);

        candidates.push({
          externalId,
          name,
          issuer: inferIssuer(name),
          network: inferNetwork(name),
          applyUrl,
          reviewUrl,
          sourceUrl: page.sourceUrl,
          imageUrl: imageMatch?.[1] ? decodeEscapedJsonText(imageMatch[1]) : null,
          categories: categoryValues,
          annualFee: parseNumericToken(feeMatch?.[1]) ?? 0,
          aprPurchase: parseNumericToken(aprMatch?.[1]),
          signUpBonusValue: parseNumericToken(signUpValueMatch?.[1]),
          welcomeBonus: signUpTextMatch?.[1] ? decodeEscapedJsonText(signUpTextMatch[1]) : null,
          rewardRateDescription: rewardsMatch?.[1] ? decodeEscapedJsonText(rewardsMatch[1]) : null,
          perks,
          minCreditScore: parseNumericToken(creditScoreMinMatch?.[1]),
        });

        rowMatch = rowRegex.exec(scanTarget);
      }
    }
  }

  const deduped = new Map<string, NerdwalletOfferCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.externalId}|${candidate.sourceUrl}`;
    if (!key.trim()) continue;
    if (!deduped.has(key)) {
      deduped.set(key, candidate);
    }
  }

  return Array.from(deduped.values());
}

export function extractOfferCandidatesFromSources(sourcePages: NerdwalletSourcePage[]): NerdwalletOfferCandidate[] {
  const merged = new Map<string, NerdwalletOfferCandidate>();

  for (const page of sourcePages) {
    const pageCandidates = extractOfferCandidatesFromSourcePage(page);
    for (const candidate of pageCandidates) {
      const key = candidate.externalId || normalizeOfferName(candidate.name);
      if (!key) continue;

      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, candidate);
        continue;
      }

      const mergedCategories = uniqueValues([...existing.categories, ...candidate.categories]);

      merged.set(key, {
        ...existing,
        categories: mergedCategories,
        applyUrl: existing.applyUrl ?? candidate.applyUrl,
        reviewUrl: existing.reviewUrl ?? candidate.reviewUrl,
        imageUrl: existing.imageUrl ?? candidate.imageUrl,
        signUpBonusValue: existing.signUpBonusValue ?? candidate.signUpBonusValue,
        welcomeBonus: existing.welcomeBonus ?? candidate.welcomeBonus,
        rewardRateDescription: existing.rewardRateDescription ?? candidate.rewardRateDescription,
        perks: uniqueValues([...existing.perks, ...candidate.perks]).slice(0, 6),
        minCreditScore: existing.minCreditScore ?? candidate.minCreditScore,
      });
    }
  }

  return Array.from(merged.values());
}

function getChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function inferCategoryFromUrl(url: string): CardCategory | 'all' {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes('travel')) return 'travel';
  if (normalizedUrl.includes('cash-back') || normalizedUrl.includes('cashback')) return 'cashback';
  if (normalizedUrl.includes('student')) return 'student';
  if (normalizedUrl.includes('secured') || normalizedUrl.includes('bad-credit')) return 'secured';
  if (normalizedUrl.includes('business')) return 'rewards';
  if (normalizedUrl.includes('reward')) return 'rewards';
  if (normalizedUrl.includes('newcomer')) return 'no-fee';

  return 'all';
}

function extractBestCreditCardLinks(baseUrl: string, html: string): string[] {
  const links = new Set<string>();
  const hrefRegex = /href=["']([^"']+)["']/gi;

  let match = hrefRegex.exec(html);
  while (match !== null) {
    const rawHref = match[1];
    if (!rawHref) {
      match = hrefRegex.exec(html);
      continue;
    }

    const absolute = toAbsoluteUrl(baseUrl, rawHref);
    if (!absolute) {
      match = hrefRegex.exec(html);
      continue;
    }

    const isBestCreditCardPage =
      absolute.includes('/ca/p/best/credit-cards/') && !absolute.includes('#');

    const isCreditCardReviewPage =
      absolute.includes('/ca/p/reviews/credit-cards/') && !absolute.includes('#');

    if (isBestCreditCardPage || isCreditCardReviewPage) {
      links.add(absolute);
    }

    match = hrefRegex.exec(html);
  }

  return Array.from(links);
}

async function fetchHtml(url: string): Promise<{ html: string; status: number }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  const html = await response.text();
  return { html, status: response.status };
}

export async function collectNerdwalletSourceUrls(): Promise<string[]> {
  const discovered = new Set<string>(FALLBACK_SOURCE_URLS);

  try {
    const { html } = await fetchHtml(NERDWALLET_HUB_URL);
    for (const url of extractBestCreditCardLinks(NERDWALLET_HUB_URL, html)) {
      discovered.add(url);
    }
  } catch {
    // Fallback URLs keep sync resilient even when the hub page fails.
  }

  return Array.from(discovered);
}

export function createOfferMatchToken(name: string, issuer: string): string {
  return normalizeSearchText(`${name} ${issuer}`);
}

export async function fetchNerdwalletSourcePages(urls: string[]): Promise<NerdwalletSourcePage[]> {
  const now = new Date().toISOString();

  const results = await Promise.all(
    urls.map(async (url): Promise<NerdwalletSourcePage> => {
      try {
        const { html, status } = await fetchHtml(url);
        const sourceTitle = extractTitle(html);
        const cleanedText = stripHtmlToText(html);

        return {
          provider: NERDWALLET_PROVIDER,
          sourceUrl: url,
          sourceCategory: inferCategoryFromUrl(url),
          sourceTitle,
          fetchedAt: now,
          status: status >= 200 && status < 300 ? 'success' : 'failed',
          httpStatus: status,
          checksum: getChecksum(html),
          errorMessage: status >= 200 && status < 300 ? null : `HTTP ${status}`,
          searchText: normalizeSearchText(`${sourceTitle ?? ''} ${cleanedText}`),
          rawHtml: html,
        };
      } catch (error) {
        return {
          provider: NERDWALLET_PROVIDER,
          sourceUrl: url,
          sourceCategory: inferCategoryFromUrl(url),
          sourceTitle: null,
          fetchedAt: now,
          status: 'failed',
          httpStatus: null,
          checksum: null,
          errorMessage: error instanceof Error ? error.message : 'Unknown fetch error',
          searchText: '',
          rawHtml: '',
        };
      }
    }),
  );

  return results;
}

export function getOfferSourceMatches(
  offerToken: string,
  sourcePages: NerdwalletSourcePage[],
): {
  sourceUrl: string | null;
  sourceCategories: string[];
  sourceMatchCount: number;
} {
  const successfulPages = sourcePages.filter((page) => page.status === 'success' && page.searchText.length > 0);

  const matchedPages = successfulPages.filter((page) => page.searchText.includes(offerToken));

  const sourceCategories = Array.from(
    new Set(
      matchedPages
        .map((page) => page.sourceCategory)
        .filter((value): value is CardCategory => value !== 'all'),
    ),
  );

  return {
    sourceUrl: matchedPages[0]?.sourceUrl ?? null,
    sourceCategories,
    sourceMatchCount: matchedPages.length,
  };
}
