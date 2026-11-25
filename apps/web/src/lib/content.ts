import fs from 'node:fs';
import path from 'node:path';

export function contentPath(...parts: string[]) {
  const local = path.join(process.cwd(), 'content', ...parts);
  return fs.existsSync(local) ? local : path.join(process.cwd(), 'apps/web/content', ...parts);
}

export function readContentJson<T>(name: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(contentPath(name), 'utf8'));
  } catch {
    return null;
  }
}
