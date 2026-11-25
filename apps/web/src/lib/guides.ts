import fs from 'node:fs';
import path from 'node:path';
import { contentPath } from './content';

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  relatedCategories: string[];
  featured: boolean;
  markdown: string;
}

export function parseFrontmatter(file: string): Guide | null {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/.exec(file.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'));
  if (!match) return null;
  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const entry = /^([a-zA-Z]+):\s*(.*?)\s*$/.exec(line);
    if (entry) fields[entry[1]] = entry[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  const { slug, title, summary, category, publishedAt, updatedAt } = fields;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || !title || !summary || !category || !match[2].trim()) return null;
  const list = (key: string) => (fields[key] || '').split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return { slug, title, summary, category, publishedAt, updatedAt, tags: list('tags'),
    relatedCategories: list('relatedCategories'), featured: fields.featured === 'true',
    readingMinutes: Number(fields.readingMinutes) || 1, markdown: match[2].trim() };
}

export function getGuides(): Guide[] {
  const dir = contentPath('guides');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => name.endsWith('.md')).flatMap(name => {
    const guide = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'));
    return guide ? [guide] : [];
  }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '') || a.slug.localeCompare(b.slug));
}

export function extractHeadings(markdown: string) {
  const headings: { text: string; id: string; line: number }[] = [];
  const ids = new Set<string>();
  let fence = '';
  markdown.split(/\r?\n/).forEach((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1].startsWith(fence) && !marker[2].trim()) fence = '';
      return;
    }
    if (marker) { fence = marker[1]; return; }
    const heading = /^ {0,3}##\s+(.+?)\s*$/.exec(line);
    if (!heading) return;
    const text = heading[1].replace(/\s+#+$/, '').replace(/[*_`]/g, '');
    const base = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    headings.push({ text, id, line: index + 1 });
  });
  return headings;
}

export function guidesForCategories(categories: string[]) {
  return getGuides().filter(g => g.relatedCategories.some(c => categories.includes(c))).slice(0, 3);
}
