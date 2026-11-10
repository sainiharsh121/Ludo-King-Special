import { readFileSync } from 'fs';
import {
  generateRandomHazardIndices,
  processHazardRespawns,
  initializeHazardState,
} from '../src/utils/boardCoordinates';

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    console.error(`❌ FAILED: ${name}`);
    process.exit(1);
  }
  passed++;
}

const overlaps = (a: number[], b: number[]) => a.some(i => b.includes(i));
const hasDupes = (a: number[]) => new Set(a).size !== a.length;

// 1. Fresh state never overlaps
for (let n = 0; n < 500; n++) {
  const s = initializeHazardState(null);
  check('fresh hazards: freeze stars and jump icons never share a cell', !overlaps(s.freezeStarIndices, s.jumpIconIndices));
  check('fresh hazards: no duplicate cells inside one icon type', !hasDupes(s.freezeStarIndices) && !hasDupes(s.jumpIconIndices));
}

// 2. Respawns never land on an occupied cell
for (let n = 0; n < 500; n++) {
  const freeze = generateRandomHazardIndices(2);
  const jump = generateRandomHazardIndices(2, freeze);
  const past = Date.now() - 1000;
  const r = processHazardRespawns(
    {
      freezeStarIndices: freeze,
      jumpIconIndices: jump,
      jumpIconIndex: jump[0] ?? null,
      freezeStarRespawnTimes: [past, past],
      jumpIconRespawnTimes: [past, past],
      jumpIconRespawnTime: past,
    },
    Date.now()
  );
  check('respawn: no overlap after respawn', !overlaps(r.nextState.freezeStarIndices, r.nextState.jumpIconIndices));
  check('respawn: no duplicates after respawn', !hasDupes(r.nextState.freezeStarIndices) && !hasDupes(r.nextState.jumpIconIndices));
}

// 3. The periodic relocation in the App tick chains freeze -> jump using fresh (local) positions
const app = readFileSync('src/App.tsx', 'utf8');
check('tick relocates freeze stars avoiding the working jump positions', /generateRandomHazardIndices\(workFreeze\.length, workJump\)/.test(app));
check('tick relocates jump icons avoiding the working (already relocated) freeze positions', /generateRandomHazardIndices\(workJump\.length, workFreeze\)/.test(app));
check('tick no longer reads stale refs inside the relocation steps', !/generateRandomHazardIndices\(current\.length, current(Jump|Stars)\)/.test(app));
check('loading a saved game strips overlapping hazard cells', /dedupedJump = Array\.from\(new Set\(loadedJump\)\)\.filter\(idx => !dedupedFreeze\.includes\(idx\)\)/.test(app));

console.log(`🎉 ALL HAZARD NO-OVERLAP TESTS PASSED (${passed})`);
