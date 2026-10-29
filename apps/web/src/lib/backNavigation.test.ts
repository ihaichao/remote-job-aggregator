import { describe, expect, it } from 'vitest';
import { cameFromList } from './backNavigation';

describe('cameFromList', () => {
  it('is true when the list left a snapshot and there is a page to go back to', () => {
    expect(cameFromList(true, 3)).toBe(true);
  });

  it('is false without a snapshot, e.g. a link shared from elsewhere', () => {
    expect(cameFromList(false, 3)).toBe(false);
  });

  it('is false in a fresh tab, e.g. a card opened with cmd-click', () => {
    expect(cameFromList(true, 1)).toBe(false);
  });
});
