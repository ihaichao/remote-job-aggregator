import { JOB_CATEGORY_LABELS } from './constants';
import { readContentJson } from './content';

export interface CategoryEditorial {
  slug: string;
  headline: string;
  seoDescription: string;
  intro: string;
  marketSnapshot: string;
  coreSkills: string[];
  remoteTips: string[];
  timezoneNote: string;
}

export const categorySlugs = Object.keys(JOB_CATEGORY_LABELS);
export function getCategory(slug: string) {
  return readContentJson<Record<string, CategoryEditorial>>('categories.json')?.[slug];
}
