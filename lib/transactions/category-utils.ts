const CATEGORY_KEYWORDS: Record<string, string[]> = {
  payments: ['payment', 'thank you', 'autopay', 'auto pay', 'preauthorized payment', 'bill payment', 'credit card payment'],
  groceries: ['grocery', 'supermarket', 'food basics', 'costco', 'loblaws', 'metro', 'sobeys'],
  gas: ['gas', 'fuel', 'shell', 'esso', 'petro', 'ultramar', 'chevron'],
  dining: ['restaurant', 'cafe', 'coffee', 'tim hortons', 'mcdonald', 'ubereats', 'uber eats', 'doordash'],
  shopping: ['amazon', 'walmart', 'best buy', 'winners', 'mall', 'retail'],
  travel: ['air', 'flight', 'hotel', 'airbnb', 'uber', 'lyft', 'expedia', 'air canada'],
  entertainment: ['netflix', 'spotify', 'cineplex', 'steam', 'itunes', 'disney'],
  bills: ['hydro', 'internet', 'phone', 'insurance', 'bill', 'utility', 'rogers', 'bell'],
  healthcare: ['pharmacy', 'clinic', 'dental', 'hospital', 'vision', 'med'],
  education: ['tuition', 'course', 'university', 'college', 'bookstore', 'udemy'],
};

export const UNCATEGORIZED_CATEGORY = 'uncategorized';

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
    if (slug) return slug;
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return category;
    }
  }

  return UNCATEGORIZED_CATEGORY;
}

export function formatCategoryLabel(category: string): string {
  if (!category || category === UNCATEGORIZED_CATEGORY) return 'Uncategorized';
  if (category === 'payments') return 'Credit Card Payments';

  return category
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}
