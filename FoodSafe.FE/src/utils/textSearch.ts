const COMBINING_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "");
}

export function matchesSearch(target: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return normalizeSearchText(target).includes(normalizedQuery);
}
