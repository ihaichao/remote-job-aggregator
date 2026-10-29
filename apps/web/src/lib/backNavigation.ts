// The homepage list saves this snapshot when a card is opened (see JobBoard)
export const LIST_SNAPSHOT_KEY = 'jobBoard:snapshot';

// "Back to list" uses history only when it lands on that list: going back
// restores the loaded jobs and scroll position, a fresh link would not.
// A card opened in a new tab copies sessionStorage but has no history.
export function cameFromList(hasSnapshot: boolean, historyLength: number): boolean {
  return hasSnapshot && historyLength > 1;
}
