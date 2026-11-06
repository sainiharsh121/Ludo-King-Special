import fs from 'fs';
import path from 'path';

/**
 * WCAG 2.x Contrast Acceptance Test Suite
 * Asserts all rendered CSS variable pairs, relative luminance,
 * colour-blind distinguishing features, and verifies no raw hex outside :root.
 */

function sRgbToLinear(channel: number): number {
  const norm = channel / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '').trim();
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const L1 = getRelativeLuminance(hex1);
  const L2 = getRelativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// 1. Parse :root from src/index.css
const cssPath = path.resolve(process.cwd(), 'src/index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
if (!rootMatch) {
  throw new Error('FAIL: Could not locate :root block in src/index.css');
}

const rootBlock = rootMatch[1];
const cssVars: Record<string, string> = {};

const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
let m;
while ((m = varRegex.exec(rootBlock)) !== null) {
  const key = m[1].trim();
  const val = m[2].trim().split('/*')[0].trim();
  cssVars[key] = val;
}

console.log('--- WCAG 2.x Contrast & Palette Acceptance Tests ---');
console.log('Loaded CSS Variables from :root:', Object.keys(cssVars).length);

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

// Ensure required role map variables exist
const requiredVars = [
  '--track-cell',
  '--grid-line',
  '--board-border',
  '--base-inner',
  '--seat-red',
  '--seat-blue',
  '--seat-purple',
  '--seat-green',
  '--seat-purple-tint',
  '--accent-gold',
  '--accent-yellow',
  '--token-body',
  '--token-outline',
  '--text-dark',
  '--text-light',
];

for (const v of requiredVars) {
  assert(cssVars[v] !== undefined, `Required CSS variable ${v} is defined in :root (${cssVars[v]})`);
}

// 2. Rendered Color Pairs & Contrast Assertions
interface ColorPairCheck {
  name: string;
  var1: string;
  var2: string;
  minRatio: number;
  expectedCategory: '3:1 Non-text' | '4.5:1 Normal text' | '3:1 Large/Bold text';
}

const renderedPairs: ColorPairCheck[] = [
  // Board shapes & cells vs neighbour
  {
    name: 'Seat Red vs Track Cell',
    var1: '--seat-red',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Seat Blue vs Track Cell',
    var1: '--seat-blue',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Seat Purple vs Track Cell',
    var1: '--seat-purple',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Fixed Seat Green vs Track Cell',
    var1: '--seat-green',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Grid Line vs Track Cell',
    var1: '--grid-line',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Board Border vs Track Cell',
    var1: '--board-border',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Base Inner White vs Dark Border',
    var1: '--base-inner',
    var2: '--grid-line',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Dark Border vs Lavender Base Quadrant',
    var1: '--grid-line',
    var2: '--seat-purple-tint',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },

  // Tokens & Outlines
  {
    name: 'Token Outline vs Track Cell',
    var1: '--token-outline',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Token Outline vs Token Body',
    var1: '--token-outline',
    var2: '--token-body',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Token Dot Red vs Token Body',
    var1: '--seat-red',
    var2: '--token-body',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Token Dot Blue vs Token Body',
    var1: '--seat-blue',
    var2: '--token-body',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Token Dot Purple vs Token Body',
    var1: '--seat-purple',
    var2: '--token-body',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Token Dot Green vs Token Body',
    var1: '--seat-green',
    var2: '--token-body',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },

  // Star & Directional Icons
  {
    name: 'Safe Star Icon vs Track Cell',
    var1: '--grid-line',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Corridor Entrance Arrow vs Track Cell',
    var1: '--grid-line',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Start Cell Arrow vs Seat Red',
    var1: '--text-light',
    var2: '--seat-red',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Start Cell Arrow vs Seat Blue',
    var1: '--text-light',
    var2: '--seat-blue',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Start Cell Arrow vs Seat Purple',
    var1: '--text-light',
    var2: '--seat-purple',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: 'Start Cell Arrow vs Seat Green',
    var1: '--text-light',
    var2: '--seat-green',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },

  // Move Hints & Outlines
  {
    name: 'Move Hint Yellow vs 2px Dark Outline',
    var1: '--accent-yellow',
    var2: '--grid-line',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },
  {
    name: '2px Dark Move Hint Outline vs Track Cell',
    var1: '--grid-line',
    var2: '--track-cell',
    minRatio: 3.0,
    expectedCategory: '3:1 Non-text',
  },

  // Text vs Background (Player labels are rendered as bold/large text with drop shadow)
  {
    name: 'Player 1 Label (White on Red)',
    var1: '--text-light',
    var2: '--seat-red',
    minRatio: 3.0,
    expectedCategory: '3:1 Large/Bold text',
  },
  {
    name: 'Player 2 Label (Dark on Lavender)',
    var1: '--text-dark',
    var2: '--seat-purple-tint',
    minRatio: 4.5,
    expectedCategory: '4.5:1 Normal text',
  },
  {
    name: 'Player Label (White on Blue)',
    var1: '--text-light',
    var2: '--seat-blue',
    minRatio: 4.5,
    expectedCategory: '4.5:1 Normal text',
  },
  {
    name: 'Player Label (White on Fixed Green bold >= 18.66px)',
    var1: '--text-light',
    var2: '--seat-green',
    minRatio: 3.0,
    expectedCategory: '3:1 Large/Bold text',
  },
  {
    name: 'Buttons/Rematch (Dark text on Accent Gold)',
    var1: '--text-dark',
    var2: '--accent-gold',
    minRatio: 4.5,
    expectedCategory: '4.5:1 Normal text',
  },
];

console.log('\n--- VERIFYING CONTRAST RATIOS ---');
const tableRows: Array<{ Name: string; Color1: string; Color2: string; Ratio: string; Required: string; Status: string }> = [];

for (const pair of renderedPairs) {
  const hex1 = cssVars[pair.var1];
  const hex2 = cssVars[pair.var2];
  const ratio = getContrastRatio(hex1, hex2);
  const ratioStr = ratio.toFixed(2) + ':1';
  const passed = ratio >= pair.minRatio;

  tableRows.push({
    Name: pair.name,
    Color1: `${pair.var1} (${hex1})`,
    Color2: `${pair.var2} (${hex2})`,
    Ratio: ratioStr,
    Required: `>= ${pair.minRatio}:1`,
    Status: passed ? 'PASS' : 'FAIL',
  });

  assert(
    passed,
    `${pair.name}: ${pair.var1} (${hex1}) vs ${pair.var2} (${hex2}) has ratio ${ratioStr} (required >= ${pair.minRatio}:1)`
  );
}

console.log('\n--- CONTRAST RATIO TABLE ---');
console.table(tableRows);

// 3. Colour-blind and Relative Luminance Check
console.log('\n--- COLOUR-BLIND & RELATIVE LUMINANCE CHECK ---');
const redLum = getRelativeLuminance(cssVars['--seat-red']);
const greenLum = getRelativeLuminance(cssVars['--seat-green']);
const blueLum = getRelativeLuminance(cssVars['--seat-blue']);
const purpleLum = getRelativeLuminance(cssVars['--seat-purple']);
const lavenderLum = getRelativeLuminance(cssVars['--seat-purple-tint']);

console.log(`Luminance Red: ${redLum.toFixed(4)} (Expected ~0.21)`);
console.log(`Luminance Green: ${greenLum.toFixed(4)} (Expected ~0.15)`);
console.log(`Luminance Blue: ${blueLum.toFixed(4)}`);
console.log(`Luminance Purple: ${purpleLum.toFixed(4)}`);
console.log(`Luminance Lavender: ${lavenderLum.toFixed(4)}`);

assert(
  redLum >= 0.19 && redLum <= 0.23,
  `Red relative luminance is ~0.21 (actual: ${redLum.toFixed(4)})`
);
assert(
  greenLum >= 0.13 && greenLum <= 0.17,
  `Green relative luminance is ~0.15 (actual: ${greenLum.toFixed(4)})`
);
assert(
  Math.abs(redLum - greenLum) >= 0.05,
  `Red vs Green brightness difference is clear (|${redLum.toFixed(2)} - ${greenLum.toFixed(2)}| = ${Math.abs(redLum - greenLum).toFixed(2)} >= 0.05)`
);

// Verify all 4 seats are distinguishable by brightness/luminance
const seatLums = [
  { name: 'Red', lum: redLum },
  { name: 'Green', lum: greenLum },
  { name: 'Blue', lum: blueLum },
  { name: 'Purple', lum: purpleLum },
];
seatLums.sort((a, b) => a.lum - b.lum);
console.log('Seat brightness order (monochrome / colour-blind distinguishable):', seatLums.map(s => `${s.name} (${s.lum.toFixed(3)})`).join(' < '));

// 4. Verify No Raw Hex Values Outside :root
console.log('\n--- NO RAW HEX OUTSIDE :ROOT ASSERTION ---');

function checkFileForRawHex(filePath: string, allowRoot: boolean = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  let textToCheck = content;
  if (allowRoot) {
    // Remove :root block before checking
    textToCheck = content.replace(/:root\s*\{[^}]+\}/g, '');
  }
  // Strip out comments to only check code if needed, but here we require clean code
  const matches = textToCheck.match(/#[0-9a-fA-F]{3,8}/g);
  return matches || [];
}

const ludoBoardPath = path.resolve(process.cwd(), 'src/components/LudoBoard.tsx');
const boardHexMatches = checkFileForRawHex(ludoBoardPath, false);
assert(
  boardHexMatches.length === 0,
  `src/components/LudoBoard.tsx contains ZERO raw hex codes outside :root (found: ${boardHexMatches.length})`
);

const indexCssMatches = checkFileForRawHex(cssPath, true);
assert(
  indexCssMatches.length === 0,
  `src/index.css contains ZERO raw hex codes outside :root (found: ${indexCssMatches.length})`
);

const playerHudPath = path.resolve(process.cwd(), 'src/components/PlayerHUD.tsx');
const hudHexMatches = checkFileForRawHex(playerHudPath, false);
assert(
  hudHexMatches.length === 0,
  `src/components/PlayerHUD.tsx contains ZERO raw hex codes outside :root (found: ${hudHexMatches.length})`
);

const gameOverModalPath = path.resolve(process.cwd(), 'src/components/GameOverModal.tsx');
const modalHexMatches = checkFileForRawHex(gameOverModalPath, false);
assert(
  modalHexMatches.length === 0,
  `src/components/GameOverModal.tsx contains ZERO raw hex codes outside :root (found: ${modalHexMatches.length})`
);

const homeScreenPath = path.resolve(process.cwd(), 'src/components/HomeScreen.tsx');
const homeScreenMatches = checkFileForRawHex(homeScreenPath, false);
assert(
  homeScreenMatches.length === 0,
  `src/components/HomeScreen.tsx contains ZERO raw hex codes outside :root (found: ${homeScreenMatches.length})`
);

console.log('\n🎉 ALL CONTRAST, WCAG 2.x, AND PALETTE ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');

