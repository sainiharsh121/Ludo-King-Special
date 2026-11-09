/**
 * Rule: every app launch starts a fresh game. The running match and remembered screen are discarded,
 * while manually saved games, the splash-seen flag and preferences are kept.
 */
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = String(v); },
  removeItem: (k: string) => { delete store[k]; },
};
let replacedUrl: string | null = null;
(globalThis as any).window = {
  location: { hash: '#game', pathname: '/', search: '' },
  history: { replaceState: (_s: unknown, _t: string, url: string) => { replacedUrl = url; } },
};

import {
  resetSessionOnLaunch,
  getSavedActiveMatch,
  ACTIVE_MATCH_STORAGE_KEY,
  ACTIVE_SCREEN_STORAGE_KEY,
  SPLASH_SEEN_STORAGE_KEY,
} from '../src/App';

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`❌ FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${name}`);
  passed++;
}

console.log('--- TEST SUITE: Fresh game on every app launch ---');

// Simulate a previous session that was killed mid-match
store[ACTIVE_MATCH_STORAGE_KEY] = JSON.stringify({ players: [{ id: 'p1' }], gameMode: 'PASS_N_PLAY' });
store[ACTIVE_SCREEN_STORAGE_KEY] = 'GAME';
store[SPLASH_SEEN_STORAGE_KEY] = 'true';
store['ludo_saved_games'] = JSON.stringify([{ id: 'save-1' }]);
store['ludo_pnp_token'] = 'ninja';
check('before launch, an unfinished match would be restored', getSavedActiveMatch() !== null);

resetSessionOnLaunch();

check('unfinished match is discarded on launch', getSavedActiveMatch() === null && !(ACTIVE_MATCH_STORAGE_KEY in store));
check('remembered screen (e.g. GAME) is discarded on launch', !(ACTIVE_SCREEN_STORAGE_KEY in store));
check('stale URL hash (#game) is cleared', replacedUrl === '/');
check('manually saved games are kept', store['ludo_saved_games'] !== undefined);
check('splash-seen flag is kept (no splash on every launch)', store[SPLASH_SEEN_STORAGE_KEY] === 'true');
check('player preferences (token skin) are kept', store['ludo_pnp_token'] === 'ninja');

console.log(`🎉 ALL FRESH-START TESTS PASSED (${passed})`);
