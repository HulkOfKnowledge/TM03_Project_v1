import taxonomy from '@/shared/category-taxonomy.json';

type TaxonomyShape = {
  otherCategory: string;
  unknownLabels: string[];
  keywords: Record<string, string[]>;
};

const SHARED_TAXONOMY = taxonomy as TaxonomyShape;
const CATEGORY_KEYWORDS: Record<string, string[]> = SHARED_TAXONOMY.keywords;
const UNKNOWN_LABELS = new Set(SHARED_TAXONOMY.unknownLabels.map((label) => label.toLowerCase()));

export const UNCATEGORIZED_CATEGORY = SHARED_TAXONOMY.otherCategory;

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function inferTransactionCategory(
  rawCategory: string | null | undefined,
  description: string,
  merchantName?: string | null,
): string {
  const raw = (rawCategory || '').trim().toLowerCase();
  const source = `${raw} ${description || ''} ${merchantName || ''}`.trim().toLowerCase();

  if (!source) return UNCATEGORIZED_CATEGORY;

  if (raw) {
    if (Object.prototype.hasOwnProperty.call(CATEGORY_KEYWORDS, raw)) {
      return raw;
    }

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => raw.includes(keyword))) {
        return category;
      }
    }

    const slug = toSlug(raw);
    if (slug && !UNKNOWN_LABELS.has(slug.replace(/[-_]/g, ' ')) && !UNKNOWN_LABELS.has(slug)) return slug;
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return category;
    }
  }

  if (UNKNOWN_LABELS.has(raw)) return UNCATEGORIZED_CATEGORY;

  return UNCATEGORIZED_CATEGORY;
}

export function formatCategoryLabel(category: string): string {
  if (!category || category === UNCATEGORIZED_CATEGORY) return 'Uncategorized';
  if (category === 'payments') return 'Credit Card Payments';

  return category
    .split(/[-_]/)
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}
