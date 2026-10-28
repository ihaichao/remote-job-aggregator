import { JOB_CATEGORY_LABELS } from './constants';

export const PAGE_SIZE = 20;
// Deepest page restored from a URL; keeps SSR to at most 200 jobs
export const MAX_RESTORE_PAGE = 10;

export interface ListQuery {
  keyword: string;
  category: string;
  regionLimit: string;
  workType: string;
  page: number;
}

export const EMPTY_QUERY: ListQuery = { keyword: '', category: '', regionLimit: '', workType: '', page: 1 };

const REGIONS = ['worldwide', 'CN'];
const WORK_TYPES = ['fulltime', 'parttime'];

type Params = Record<string, string | string[] | undefined>;

function first(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

function oneOf(value: string, allowed: string[]): string {
  return allowed.includes(value) ? value : '';
}

export function parseListQuery(params: Params): ListQuery {
  const page = parseInt(first(params, 'page'), 10);
  return {
    keyword: first(params, 'keyword'),
    category: oneOf(first(params, 'category'), Object.keys(JOB_CATEGORY_LABELS)),
    regionLimit: oneOf(first(params, 'regionLimit'), REGIONS),
    workType: oneOf(first(params, 'workType'), WORK_TYPES),
    page: Number.isNaN(page) ? 1 : Math.min(Math.max(page, 1), MAX_RESTORE_PAGE),
  };
}

export function serializeListQuery(q: ListQuery): string {
  const params = new URLSearchParams();
  if (q.keyword) params.set('keyword', q.keyword);
  if (q.category) params.set('category', q.category);
  if (q.regionLimit) params.set('regionLimit', q.regionLimit);
  if (q.workType) params.set('workType', q.workType);
  if (q.page > 1) params.set('page', String(q.page));
  return params.toString();
}

export function mergeJobs<T extends { id: number }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((job) => job.id));
  return [...existing, ...incoming.filter((job) => !seen.has(job.id))];
}

// Any filter change starts over from page 1; a page-only patch keeps the filters
export function applyQueryPatch(q: ListQuery, patch: Partial<ListQuery>): ListQuery {
  const next = { ...q, ...patch };
  const filterChanged = (['keyword', 'category', 'regionLimit', 'workType'] as const).some((k) => next[k] !== q[k]);
  return filterChanged ? { ...next, page: 1 } : next;
}
