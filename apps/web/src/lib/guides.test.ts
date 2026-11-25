import { expect, it } from 'vitest';
import { extractHeadings, parseFrontmatter } from './guides';

it('reads quoted scalars, CSV lists, dates and the original Markdown', () => {
  const body = '## 目录\n\n| A | B |\n|---|---|\n| 1 | 2 |';
  const file = ['---','slug: test-guide','title: "岗位: 选择"','category: 求职','summary: 示例',
    'tags: 简历, 英语','relatedCategories: backend, ai','publishedAt: 2026-11-24',
    'updatedAt: 2026-11-24','readingMinutes: 10','featured: true','---',body].join('\r\n');
  expect(parseFrontmatter(file)).toMatchObject({ slug: 'test-guide', title: '岗位: 选择', tags: ['简历','英语'],
    relatedCategories: ['backend','ai'], featured: true, readingMinutes: 10, markdown: body });
  expect(parseFrontmatter('unfinished')).toBeNull();
});

it('keeps duplicate Chinese anchors distinct and ignores fenced examples', () => {
  const headings = extractHeadings('## 远程 工作\n~~~md\n## 示例\n~~~\n### 小节\n## 远程 工作');
  expect(headings.map(h => h.id)).toEqual(['远程-工作','远程-工作-2']);
  expect(headings[1].line).toBe(6);
});

it('treats absent editorial files as empty from an unrelated working directory', async () => {
  const { vi } = await import('vitest');
  const { getGuides } = await import('./guides');
  const { getCategory } = await import('./categories');
  const { getInsightsEditorial } = await import('./insights');
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue('/nonexistent/remotecn-empty-test');
  try {
    expect(getGuides()).toEqual([]);
    expect(getCategory('ai')).toBeUndefined();
    expect(getInsightsEditorial()).toBeNull();
  } finally {
    cwd.mockRestore();
  }
});
