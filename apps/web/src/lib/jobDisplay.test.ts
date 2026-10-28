import { describe, expect, it } from 'vitest';
import { displayCompany } from './jobDisplay';

describe('displayCompany', () => {
  it('hides the scraper placeholder and blanks', () => {
    expect(displayCompany('Unknown')).toBeUndefined();
    expect(displayCompany('  ')).toBeUndefined();
    expect(displayCompany(undefined)).toBeUndefined();
  });

  it('keeps a real company name, trimmed', () => {
    expect(displayCompany(' Acme ')).toBe('Acme');
  });
});
