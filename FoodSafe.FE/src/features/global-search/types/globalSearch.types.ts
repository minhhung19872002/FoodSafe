export interface SearchHit {
  id: string;
  title: string;
  subtitle?: string;
  route: string;
}

export interface SearchGroup {
  entityType: string;
  label: string;
  items: SearchHit[];
}

export interface GlobalSearchResult {
  groups: SearchGroup[];
}
