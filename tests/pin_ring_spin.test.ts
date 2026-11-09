import fs from 'fs';
import path from 'path';

/**
 * Pin token (skin 1): the pedestal ring under the pin has small gaps and rotates while it is the owner's turn.
 */
let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`❌ FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${name}`);
  passed++;
}
const read = (f: string) => fs.readFileSync(path.resolve(process.cwd(), f), 'utf8');

console.log('--- TEST SUITE: Pin token pedestal ring spin ---');
const svg = read('src/components/TokenPreviewSVG.tsx');
const board = read('src/components/LudoBoard.tsx');
const hud = read('src/components/PlayerHUD.tsx');
const css = read('src/index.css');

check('TokenPreviewSVG exposes a spinRing prop', /spinRing\?: boolean/.test(svg));
check('pin ring is drawn as dashed segments (small gaps)', /strokeDasharray="4 2\.125"/.test(svg));
check('ring group rotates around the ring centre (14,20) only when spinRing is set', /spinRing\s*\?\s*'pin-ring-spin'/.test(svg) && /transformOrigin: '14px 20px'/.test(svg));
check('spin phase is shared/global so re-mounted tokens do not restart the rotation', /Date\.now\(\) % PIN_RING_SPIN_MS/.test(svg));
check('CSS defines the pinRingSpin keyframes (0 -> 360deg, linear, infinite)', /@keyframes pinRingSpin/.test(css) && /rotate\(360deg\)/.test(css) && /\.pin-ring-spin\s*\{[^}]*linear[^}]*infinite/s.test(css));
check('reduced-motion users get no spinning', /prefers-reduced-motion: reduce\)\s*\{\s*\.pin-ring-spin\s*\{\s*animation: none/.test(css));
check('board spins rings of the player whose turn it is (static, yard and hopping tokens)', (board.match(/spinRing=/g) || []).length === 3 && /movablePlayerId \?\? activePlayer\.id\) && phase !== 'GAME_OVER'/.test(board));
check('HUD pin spins for the active player', /spinRing=\{isActiveTurn/.test(hud));

console.log(`🎉 ALL PIN RING SPIN TESTS PASSED (${passed})`);
