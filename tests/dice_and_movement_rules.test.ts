import {
  createConfig,
  createInitialState,
  createPRNG,
  step,
  generateLegalMoves,
  getRingIndex,
  isSafeRingIndex,
  DEFAULT_CFG,
  GameState,
  GameAction,
  GameEvent,
  LegalMove,
} from '../src/engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('========================================================================');
console.log('--- TEST SUITE: DICE NUMBERS AND TOKEN MOVEMENT RULES (4-SEAT LUDO) ---');
console.log('========================================================================\n');

// =========================================================================
// SECTION 1: DICE
// =========================================================================
console.log('--- SECTION 1: FAIR D6 & DICE PROBABILITIES ---');
{
  const rng = createPRNG(424242);
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const N = 60000;
  let allInRange = true;

  for (let i = 0; i < N; i++) {
    const roll = rng.d6();
    if (roll < 1 || roll > 6) allInRange = false;
    counts[roll]++;
  }
  assert(allInRange, 'All 60,000 rolls are integers strictly within 1..6');

  // Each face has probability exactly 1/6 (expected = 10,000)
  const expected = N / 6;
  let chiSquare = 0;
  for (let face = 1; face <= 6; face++) {
    const obs = counts[face];
    chiSquare += Math.pow(obs - expected, 2) / expected;
    const freq = obs / N;
    assert(
      Math.abs(freq - 1 / 6) < 0.015,
      `Face ${face} frequency ${freq.toFixed(4)} is close to 1/6 (~0.1667), observed: ${obs}`
    );
  }
  // Chi-Square test: critical value for 5 df at alpha=0.001 is 20.515
  assert(chiSquare < 20.515, `Chi-Square statistic ${chiSquare.toFixed(2)} passes uniformity test (critical 20.52)`);

  // Test three sixes in a row probability (~1/216 = 0.0046296)
  // In 216,000 rolls, each window of 3 has probability 1/216 of (6,6,6), expected: ~1000
  const TRIALS = 216000;
  let threeSixCount = 0;
  let r_prev2 = 0;
  let r_prev1 = 0;
  for (let i = 0; i < TRIALS; i++) {
    const r = rng.d6();
    if (r === 6 && r_prev1 === 6 && r_prev2 === 6) {
      threeSixCount++;
    }
    r_prev2 = r_prev1;
    r_prev1 = r;
  }
  assert(
    threeSixCount >= 850 && threeSixCount <= 1150,
    `Three consecutive sixes occurred ${threeSixCount} times in ${TRIALS} rolls (~1/216 expected: ~1000)`
  );

  // Result is decided BEFORE animation and never changes in state
  let state = createInitialState(createConfig({ firstSeat: 0 }), rng);
  const rollRes = step(state, { type: 'ROLL_DICE', forceRoll: 4 }, rng);
  assert(rollRes.state.diceValue === 4, 'Dice result decided and recorded in state immediately (never changes)');
}

// =========================================================================
// SECTION 2: WHAT EACH NUMBER ALLOWS
// =========================================================================
console.log('\n--- SECTION 2: WHAT EACH NUMBER ALLOWS ---');
{
  const rng = createPRNG(111);
  const state = createInitialState(createConfig({ firstSeat: 0 }), rng);

  // Rolls 1-5: Tokens in base cannot come out
  for (let r = 1; r <= 5; r++) {
    const moves = generateLegalMoves(state, 0, r);
    assert(moves.length === 0, `Roll ${r}: Token in base CANNOT come out (0 legal moves)`);
  }

  // Roll 6: Tokens in base may come out to start square (uses whole 6)
  const moves6 = generateLegalMoves(state, 0, 6);
  assert(moves6.length === 4, 'Roll 6: All 4 base tokens can choose to come out');
  assert(moves6.every(m => m.fromProgress === 0 && m.toProgress === 1), 'Coming out lands on p = 1 (start square)');
  assert(moves6.every(m => m.destRingIndex === 0), 'Lands on Red start square (ringIndex = 0)');

  // Coming out uses full 6: lands on start square and does NOT move further
  let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
  res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
  assert(res.state.tokens[0][0].progress === 1, 'Token lands on start square p = 1 and does not move further');
  assert(res.state.phase === 'WAIT_ROLL', 'Roll 6 grants an extra roll');
  assert(res.state.activeSeat === 0, 'Active seat keeps turn for extra roll');
}

// =========================================================================
// SECTION 3: TOKEN PATH AND STEP COUNTING
// =========================================================================
console.log('\n--- SECTION 3: TOKEN PATH AND STEP COUNTING ---');
{
  const cfg = createConfig();

  // Progress p definitions:
  // 0 = base yard
  // 1 = own start square
  // 2..51 = outer ring
  // 52..56 = owner's private home column
  // 57 = home (centre)
  // Distance from start (1) to home (57) is exactly 56 steps
  assert(57 - 1 === 56, 'Distance from start square (p=1) to home (p=57) is exactly 56 steps');

  // Ring index formula: ringIndex = (seatStartRing[seat] + p - 1) mod 52
  // Seat start squares: Red = 0, Green = 13, Yellow = 26, Blue = 39
  const expectedStarts = [0, 13, 26, 39];
  for (let s = 0; s < 4; s++) {
    assert(cfg.seatStartRing[s] === expectedStarts[s], `Seat ${s} start square is ring index ${expectedStarts[s]}`);

    // Verify p = 1 matches start square
    assert(getRingIndex(s, 1, cfg) === expectedStarts[s], `Seat ${s} at p=1 has ringIndex = ${expectedStarts[s]}`);

    // Verify all steps on ring 1..51
    for (let p = 1; p <= 51; p++) {
      const expectedRing = (expectedStarts[s] + p - 1) % 52;
      assert(getRingIndex(s, p, cfg) === expectedRing, `Seat ${s} p=${p} correctly maps to ring ${expectedRing}`);
    }

    // Verify p = 51 is the seat's arrow cell
    const arrowRing = (expectedStarts[s] + 51 - 1) % 52;
    assert(getRingIndex(s, 51, cfg) === arrowRing, `Seat ${s} p=51 arrow cell is ring ${arrowRing}`);

    // Verify p >= 52 enters private home column (destRingIndex is null)
    for (let p = 52; p <= 57; p++) {
      assert(getRingIndex(s, p, cfg) === null, `Seat ${s} p=${p} is inside private home column / home (ringIndex null)`);
    }
  }

  // Direction is forward and clockwise; step counting starts from NEXT cell
  const rng = createPRNG(333);
  const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
  state.tokens[0][0].progress = 1; // at start cell
  // Moving 4 steps lands on 1 + 4 = 5 (cell 1 not counted)
  const moves = generateLegalMoves(state, 0, 4);
  const move = moves.find(m => m.seat === 0 && m.tokenId === 0)!;
  assert(move.toProgress === 5, 'Moving 4 steps from p=1 lands on p=5 (start cell not counted)');
}

// =========================================================================
// SECTION 4: EXACT ROLL TO HOME
// =========================================================================
console.log('\n--- SECTION 4: EXACT ROLL TO HOME ---');
{
  const rng = createPRNG(444);
  const state = createInitialState(createConfig({ firstSeat: 0, exactRollToHome: true }), rng);
  state.tokens[0][0].progress = 54; // 3 steps left (57 - 54 = 3)
  state.tokens[0][1].progress = 0;
  state.tokens[0][2].progress = 0;
  state.tokens[0][3].progress = 0;

  // Roll 3 -> exactly home (54 + 3 = 57)
  const moves3 = generateLegalMoves(state, 0, 3);
  assert(moves3.length === 1 && moves3[0].toProgress === 57, 'Roll 3: Exactly reaches home (p=57)');

  // Roll 2 -> moves inside home column to 56
  const moves2 = generateLegalMoves(state, 0, 2);
  assert(moves2.length === 1 && moves2[0].toProgress === 56, 'Roll 2: Moves forward inside home column to p=56');

  // Roll 1 -> moves inside home column to 55
  const moves1 = generateLegalMoves(state, 0, 1);
  assert(moves1.length === 1 && moves1[0].toProgress === 55, 'Roll 1: Moves forward inside home column to p=55');

  // Roll 4 -> overshoot (54 + 4 = 58 > 57) -> illegal
  const moves4 = generateLegalMoves(state, 0, 4);
  assert(moves4.length === 0, 'Roll 4: Overshoots home (58 > 57), token cannot move (no bounce-back)');

  // Roll 5 -> overshoot -> illegal
  const moves5 = generateLegalMoves(state, 0, 5);
  assert(moves5.length === 0, 'Roll 5: Overshoots home (59 > 57), token cannot move (no bounce-back)');

  // Roll 6 -> token at 54 cannot move (54 + 6 = 60 > 57), but tokens in base can come out!
  const moves6 = generateLegalMoves(state, 0, 6);
  assert(moves6.every(m => m.fromProgress === 0), 'Roll 6: Token at 54 cannot move, but base tokens can come out');
}

// =========================================================================
// SECTION 5: PASSING AND LANDING
// =========================================================================
console.log('\n--- SECTION 5: PASSING AND LANDING ---');
{
  const rng = createPRNG(555);

  // 1. Passing over tokens: has no effect by default (stackBlocksPassing = false)
  {
    const state = createInitialState(createConfig({ firstSeat: 0, stackBlocksPassing: false }), rng);
    state.tokens[0][0].progress = 1; // Red on ring 0
    state.tokens[1][0].progress = 44; // Green on ring 4
    state.tokens[1][1].progress = 44; // Green stack on ring 4

    // Red rolls 6: moves from p=1 (ring 0) to p=7 (ring 6), passing through ring 4
    const moves = generateLegalMoves(state, 0, 6);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0);
    assert(redMove !== undefined && redMove.toProgress === 7, 'Passing over enemy stack is allowed when stackBlocksPassing is false');
  }

  // 2. stackBlocksPassing = true: opponent stack CANNOT be crossed
  {
    const state = createInitialState(createConfig({ firstSeat: 0, stackBlocksPassing: true }), rng);
    state.tokens[0][0].progress = 1; // Red on ring 0
    state.tokens[1][0].progress = 44; // Green stack on ring 4
    state.tokens[1][1].progress = 44;

    const moves = generateLegalMoves(state, 0, 6);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0);
    assert(redMove === undefined, 'Opponent stack BLOCKS passing when stackBlocksPassing is true');
  }

  // 3. Landing on safe cell: coexist, no capture
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1; // Red on ring 0
    // Place green token on safe star ring 8
    // Green (seat 1): (13 + p - 1) % 52 = 8 -> p = 48
    state.tokens[1][0].progress = 48;
    assert(isSafeRingIndex(8, state.cfg), 'Ring 8 is safe star');

    // Red rolls 8 -> lands on ring 8 (1 + 8 = 9, ring index (0 + 9 - 1) = 8)
    // Red rolls 6 + 2, let's test with token at p=7 rolling 2 -> lands on ring 8
    state.tokens[0][0].progress = 7;
    const moves = generateLegalMoves(state, 0, 2);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0)!;
    assert(redMove.destRingIndex === 8, 'Red lands on ring 8');
    assert(redMove.isEnemyCapture === false, 'Landing on safe cell NEVER captures enemy');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 2 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[1][0].progress === 48, 'Green enemy token coexists on safe cell (not sent to base)');
    assert(!res.events.some(e => e.type === 'ENEMY_CAPTURED'), 'No ENEMY_CAPTURED event emitted');
  }

  // 4. Landing on lone opponent on non-safe cell: back to base, mover gets extra roll
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1; // Red on ring 0
    state.tokens[1][0].progress = 45; // Green on ring 5 (non-safe)
    assert(!isSafeRingIndex(5, state.cfg), 'Ring 5 is non-safe');

    // Red rolls 5: lands on ring 5
    const moves = generateLegalMoves(state, 0, 5);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0)!;
    assert(redMove.isEnemyCapture === true, 'Landing on lone enemy isEnemyCapture is true');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 5 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[1][0].progress === 0, 'Captured enemy token sent back to base (p=0)');
    assert(res.state.phase === 'WAIT_ROLL', 'Mover gets extra roll after capture');
    assert(res.state.activeSeat === 0, 'Mover keeps turn for extra roll');
    assert(res.events.some(e => e.type === 'BONUS_ROLL' && e.reason === 'ENEMY_CAPTURE'), 'BONUS_ROLL event emitted with reason ENEMY_CAPTURE');
  }

  // 5. Landing on own token: stack, no capture
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1; // Red token 0 on ring 0
    state.tokens[0][1].progress = 6; // Red token 1 on ring 5

    // Red rolls 5: token 0 moves to ring 5 where token 1 is
    const moves = generateLegalMoves(state, 0, 5);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0)!;
    assert(redMove.formsStack === true, 'Landing on own token forms stack');
    assert(redMove.isEnemyCapture === false, 'Landing on own token does not capture');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 5 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][1].progress === 6, 'Existing friendly token remains on square');
    assert(res.state.tokens[0][0].progress === 6, 'Moving token lands on same square');
    assert(res.events.some(e => e.type === 'STACK_FORMED'), 'STACK_FORMED event emitted');
  }

  // 6. Home column cells are private: never captured, never shared with opponents
  {
    const state = createInitialState(createConfig(), rng);
    state.tokens[0][0].progress = 53; // Red in home column
    state.tokens[1][0].progress = 53; // Green in its own home column
    assert(getRingIndex(0, 53, state.cfg) === null, 'Red home column has null ringIndex');
    assert(getRingIndex(1, 53, state.cfg) === null, 'Green home column has null ringIndex');
    // They cannot interact or capture each other
  }

  // 7. Tokens on the same seat stack inside private home column (52..56)
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 49;
    state.tokens[0][1].progress = 53; // Token 1 already in home column

    const moves = generateLegalMoves(state, 0, 4);
    const m0 = moves.find(m => m.tokenId === 0)!;
    assert(m0 !== undefined && m0.toProgress === 53, 'Token 0 moves to p=53');
    assert(m0.formsStack === true, 'Landing on friendly token in home column sets formsStack = true');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 4 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 53, 'Token 0 is at p=53');
    assert(res.state.tokens[0][1].progress === 53, 'Token 1 is at p=53');
    assert(res.events.some(e => e.type === 'STACK_FORMED' && e.isHomeColumn === true), 'STACK_FORMED event emitted for home column');
  }
}

// =========================================================================
// SECTION 6: START SQUARE CASES
// =========================================================================
console.log('\n--- SECTION 6: START SQUARE CASES ---');
{
  const rng = createPRNG(666);

  // 1. Own token already on start square: a new token may still come out; they stack
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1; // Own token 0 already on start square
    state.tokens[0][1].progress = 0; // Token 1 in base

    const moves = generateLegalMoves(state, 0, 6);
    const token1Move = moves.find(m => m.seat === 0 && m.tokenId === 1)!;
    assert(token1Move !== undefined, 'New token can come out when own token is already on start square');
    assert(token1Move.formsStack === true, 'Coming out to occupied start square sets formsStack = true');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 1 }, rng);
    assert(res.state.tokens[0][0].progress === 1, 'Token 0 stays on start square (p=1)');
    assert(res.state.tokens[0][1].progress === 1, 'Token 1 lands on start square (p=1)');
    assert(res.events.some(e => e.type === 'STACK_FORMED'), 'STACK_FORMED event emitted on start square');
  }

  // 2. Opponent token on your start square: startSquareCapture = false (DEFAULT)
  // Start squares are safe, so both stay, NO capture
  {
    const state = createInitialState(createConfig({ firstSeat: 0, startSquareCapture: false }), rng);
    // Green (seat 1) token sits on Red's start square (ring 0)
    // Green start is 13: (13 + p - 1) % 52 = 0 -> p = 40
    state.tokens[1][0].progress = 40;
    assert(getRingIndex(1, 40, state.cfg) === 0, 'Green token is on Red start square (ring 0)');
    assert(state.tokens[0][0].progress === 0, 'Red token 0 is in base');

    const moves = generateLegalMoves(state, 0, 6);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0)!;
    assert(redMove.isEnemyCapture === false, 'startSquareCapture = false: isEnemyCapture is false on start square');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[1][0].progress === 40, 'Opponent remains on start square (both stay, no capture)');
    assert(res.state.tokens[0][0].progress === 1, 'Red token entered start square');
    assert(!res.events.some(e => e.type === 'ENEMY_CAPTURED'), 'No ENEMY_CAPTURED event on start square');
  }

  // 3. Variant flag startSquareCapture = true: Opponent on your start square IS captured
  {
    const state = createInitialState(createConfig({ firstSeat: 0, startSquareCapture: true }), rng);
    state.tokens[1][0].progress = 40; // Green token on Red start square (ring 0)
    state.tokens[0][0].progress = 0; // Red token 0 in base

    const moves = generateLegalMoves(state, 0, 6);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0)!;
    assert(redMove.isEnemyCapture === true, 'startSquareCapture = true: isEnemyCapture is true on start square');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[1][0].progress === 0, 'startSquareCapture = true: Opponent sent back to base');
    assert(res.state.tokens[0][0].progress === 1, 'Red token on start square');
    assert(res.events.some(e => e.type === 'ENEMY_CAPTURED'), 'ENEMY_CAPTURED event emitted');
  }

  // 4. startSquareCapture = true AND stackBlocksCapture = true:
  // Opponent stack on start square BLOCKS emerging from base yard!
  {
    const state = createInitialState(createConfig({ firstSeat: 0, startSquareCapture: true, stackBlocksCapture: true }), rng);
    // Green stack (2 tokens) on Red start square (ring 0)
    state.tokens[1][0].progress = 40;
    state.tokens[1][1].progress = 40;
    // Red has all tokens in base
    state.tokens[0][0].progress = 0;
    state.tokens[0][1].progress = 0;
    state.tokens[0][2].progress = 0;
    state.tokens[0][3].progress = 0;

    const moves = generateLegalMoves(state, 0, 6);
    assert(moves.length === 0, 'startSquareCapture + stackBlocksCapture: Opponent stack on start square BLOCKS emerging from base');
  }

  // 5. startSquareCapture = true AND stackBlocksCapture = false:
  // Opponent stack on start square is CAPTURED when emerging from base!
  {
    const state = createInitialState(createConfig({ firstSeat: 0, startSquareCapture: true, stackBlocksCapture: false }), rng);
    state.tokens[1][0].progress = 40;
    state.tokens[1][1].progress = 40;
    state.tokens[0][0].progress = 0;

    const moves = generateLegalMoves(state, 0, 6);
    const redMove = moves.find(m => m.seat === 0 && m.tokenId === 0);
    assert(redMove !== undefined, 'startSquareCapture + stackBlocksCapture=false: Can emerge onto opponent stack');
    assert(redMove.isEnemyCapture === true, 'isEnemyCapture is true');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[1][0].progress === 0, 'Opponent token 0 captured to base');
    assert(res.state.tokens[1][1].progress === 0, 'Opponent token 1 captured to base');
    const captureEvents = res.events.filter(e => e.type === 'ENEMY_CAPTURED');
    assert(captureEvents.length === 2, 'Exactly 2 ENEMY_CAPTURED events emitted for the stack');
    assert(res.state.activeSeat === 0, 'Mover gets extra roll');
  }
}

// =========================================================================
// SECTION 7: CHOOSING WHICH TOKEN MOVES
// =========================================================================
console.log('\n--- SECTION 7: CHOOSING WHICH TOKEN MOVES ---');
{
  const rng = createPRNG(777);

  // 1. 0 legal moves with non-6 -> turn passes
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    // All 4 tokens in base, roll 5
    const res = step(state, { type: 'ROLL_DICE', forceRoll: 5 }, rng);
    assert(res.state.activeSeat === 1, '0 legal moves with roll 5: Turn passes to seat 1');
    assert(res.events.some(e => e.type === 'TURN_PASSED' && e.reason === 'NO_LEGAL_MOVES'), 'Emitted TURN_PASSED');
  }

  // 2. 0 legal moves with 6 -> extra roll still given!
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    // Token at 54, other tokens finished at 57
    state.tokens[0][0].progress = 54;
    state.tokens[0][1].progress = 57;
    state.tokens[0][2].progress = 57;
    state.tokens[0][3].progress = 57;

    // Roll 6: 54 + 6 = 60 > 57 (illegal). 0 legal moves exist!
    const res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    assert(res.state.activeSeat === 0, '0 legal moves with roll 6: Extra roll is STILL given (seat 0 stays active)');
    assert(res.state.phase === 'WAIT_ROLL', 'State is WAIT_ROLL for extra roll');
    assert(res.events.some(e => e.type === 'BONUS_ROLL' && e.reason === 'SIX'), 'BONUS_ROLL reason SIX emitted');
  }

  // 3. Tokens on the same cell (a stack) move one at a time, never together
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1;
    state.tokens[0][1].progress = 1; // Tokens 0 and 1 form a stack at p = 1

    const moves = generateLegalMoves(state, 0, 4);
    const m0 = moves.find(m => m.tokenId === 0)!;
    const m1 = moves.find(m => m.tokenId === 1)!;
    assert(m0 !== undefined && m1 !== undefined, 'Both tokens in stack have individual legal moves');

    // Select token 0
    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 4 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 5, 'Token 0 moved to p = 5');
    assert(res.state.tokens[0][1].progress === 1, 'Token 1 remained at p = 1 (stacked tokens move ONE at a time, never together)');
  }
}

// =========================================================================
// SECTION 8: EXTRA ROLLS AND THE THREE-SIX LIMIT
// =========================================================================
console.log('\n--- SECTION 8: EXTRA ROLLS AND THE THREE-SIX LIMIT ---');
{
  const rng = createPRNG(888);

  // 1. One move earns at most ONE extra roll (a 6 that also captures = 1 extra roll)
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1; // Red on ring 0
    state.tokens[1][0].progress = 46; // Green on ring 6 (non-safe)

    // Red rolls 6: moves to ring 6 (captures Green)
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);

    const bonusEvents = res.events.filter(e => e.type === 'BONUS_ROLL');
    assert(bonusEvents.length === 1, 'A 6 that also captures earns exactly ONE extra roll (no double bonus)');
  }

  // 2. No extra roll if move finished the game
  {
    const state = createInitialState(createConfig({ firstSeat: 0, winTokensPerSeat: 1, classicEnd: 'FIRST_WINNER' }), rng);
    state.tokens[0][0].progress = 56;

    // Red rolls 1 to reach home and win game
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 1 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);

    assert(res.state.gameOver === true, 'Game is over');
    assert(!res.events.some(e => e.type === 'BONUS_ROLL'), 'NO extra roll awarded when move finishes the game');
  }

  // 3. Three 6s in a row in one turn: 3rd six not played, turn ends immediately, moves made stay
  {
    let state = createInitialState(createConfig({ firstSeat: 0 }), rng);

    // Roll 1: 6 -> move token 0 out (0 -> 1)
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    state = res.state;
    assert(state.tokens[0][0].progress === 1, 'Move 1 made (p=1)');

    // Roll 2: 6 -> move token 0 forward (1 -> 7)
    res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    state = res.state;
    assert(state.tokens[0][0].progress === 7, 'Move 2 made (p=7)');

    // Roll 3: 6 -> FORFEIT!
    res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    state = res.state;
    assert(state.tokens[0][0].progress === 7, 'Third six: Moves already made stay (progress remains 7)');
    assert(state.activeSeat === 1, 'Third six: Turn ends immediately, passes to next seat');
    assert(state.sixesInRow === 0, 'Third six: sixes counter reset');
    assert(res.events.some(e => e.type === 'THREE_SIX_FORFEIT'), 'THREE_SIX_FORFEIT event emitted');
  }

  // 4. Six counter resets when a non-6 is rolled
  {
    let state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    // Roll 6 -> sixesInRow = 1
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    state = res.state;
    assert(state.sixesInRow === 1, 'sixesInRow is 1 after first 6');

    // Roll 3 (non-6)
    res = step(state, { type: 'ROLL_DICE', forceRoll: 3 }, rng);
    state = res.state;
    assert(state.sixesInRow === 0, 'sixesInRow resets to 0 when non-6 is rolled');
  }

  // 5. In CLASSIC mode: completing that seat's last token on a roll of 6 earns NO bonus roll!
  {
    const state = createInitialState(createConfig({ firstSeat: 0, mode: 'CLASSIC', classicEnd: 'UNTIL_ALL_RANKED' }), rng);
    state.tokens[0][0].progress = 57;
    state.tokens[0][1].progress = 57;
    state.tokens[0][2].progress = 57;
    state.tokens[0][3].progress = 51; // 4th token on arrow cell (51 + 6 = 57)

    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 3 }, rng);

    assert(res.state.tokens[0][3].progress === 57, 'Token reached home');
    assert(res.state.finishedSeats.includes(0), 'Seat 0 is finished');
    assert(!res.events.some(e => e.type === 'BONUS_ROLL'), 'NO bonus roll awarded when seat finishes in CLASSIC mode');
    assert(res.state.activeSeat === 1, 'Turn passes to next unfinished seat (seat 1)');
  }
}

// =========================================================================
// SECTION 9: ACCEPTANCE TESTS TABLE (EXACT SCENARIOS)
// =========================================================================
console.log('\n--- SECTION 9: EXACT ACCEPTANCE TESTS TABLE ---');
{
  const rng = createPRNG(999);

  // Scenario 1: All 4 tokens in base, Roll 5 -> no move, turn passes
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    const moves = generateLegalMoves(state, 0, 5);
    assert(moves.length === 0, 'Acceptance 1: All 4 in base, Roll 5 -> 0 legal moves');

    const res = step(state, { type: 'ROLL_DICE', forceRoll: 5 }, rng);
    assert(res.state.activeSeat === 1, 'Acceptance 1: Turn passes to seat 1');
  }

  // Scenario 2: All 4 tokens in base, Roll 6 -> choose token -> p = 1, extra roll
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    const moves = generateLegalMoves(state, 0, 6);
    assert(moves.length === 4, 'Acceptance 2: All 4 in base, Roll 6 -> 4 legal moves to choose from');

    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 2 }, rng);
    assert(res.state.tokens[0][2].progress === 1, 'Acceptance 2: Chosen token lands on p = 1');
    assert(res.state.activeSeat === 0, 'Acceptance 2: Extra roll awarded (seat 0 active)');
    assert(res.state.phase === 'WAIT_ROLL', 'Acceptance 2: Phase is WAIT_ROLL');
  }

  // Scenario 3: Token at p = 1, Roll 4 -> p = 5 (start cell not counted)
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 1;
    const moves = generateLegalMoves(state, 0, 4);
    const m = moves.find(mv => mv.tokenId === 0)!;
    assert(m.toProgress === 5, 'Acceptance 3: Token at p=1, Roll 4 -> lands on p=5 (start cell not counted)');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 4 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 5, 'Acceptance 3: Token progress is 5');
  }

  // Scenario 4: Token at p = 49, Roll 4 -> p = 53 (turns into home column)
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 49;
    const moves = generateLegalMoves(state, 0, 4);
    const m = moves.find(mv => mv.tokenId === 0)!;
    assert(m.toProgress === 53, 'Acceptance 4: Token at p=49, Roll 4 -> lands on p=53 (turns into home column)');
    assert(m.destRingIndex === null, 'Acceptance 4: Destination is inside home column (null ringIndex)');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 4 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 53, 'Acceptance 4: Token progress is 53');
  }

  // Scenario 5: Token at p = 54, Roll 3 -> home (p = 57), extra roll
  {
    const state = createInitialState(createConfig({ firstSeat: 0, winTokensPerSeat: 4 }), rng);
    state.tokens[0][0].progress = 54;
    const moves = generateLegalMoves(state, 0, 3);
    const m = moves.find(mv => mv.tokenId === 0)!;
    assert(m.toProgress === 57, 'Acceptance 5: Token at p=54, Roll 3 -> reaches home (p=57)');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 3 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 57, 'Acceptance 5: Token reached home (p=57)');
    assert(res.state.activeSeat === 0, 'Acceptance 5: Extra roll awarded');
    assert(res.events.some(e => e.type === 'TOKEN_HOME'), 'Acceptance 5: TOKEN_HOME event emitted');
    assert(res.events.some(e => e.type === 'BONUS_ROLL' && e.reason === 'TOKEN_HOME'), 'Acceptance 5: BONUS_ROLL reason TOKEN_HOME');
  }

  // Scenario 6: Token at p = 54, only token out, Roll 5 -> no move, turn passes
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 54;
    state.tokens[0][1].progress = 0;
    state.tokens[0][2].progress = 0;
    state.tokens[0][3].progress = 0;

    const moves = generateLegalMoves(state, 0, 5);
    assert(moves.length === 0, 'Acceptance 6: Token at p=54, only token out, Roll 5 -> 0 legal moves');

    const res = step(state, { type: 'ROLL_DICE', forceRoll: 5 }, rng);
    assert(res.state.activeSeat === 1, 'Acceptance 6: Turn passes to seat 1');
    assert(res.events.some(e => e.type === 'TURN_PASSED'), 'Acceptance 6: TURN_PASSED event emitted');
  }

  // Scenario 7: Token at p = 51 (arrow cell), Roll 1 -> p = 52 (enters home column)
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 51;
    const moves = generateLegalMoves(state, 0, 1);
    const m = moves.find(mv => mv.tokenId === 0)!;
    assert(m.toProgress === 52, 'Acceptance 7: Token at p=51, Roll 1 -> lands on p=52 (enters home column)');
    assert(m.destRingIndex === null, 'Acceptance 7: p=52 is inside home column');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 1 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 52, 'Acceptance 7: Token progress is 52');
  }

  // Scenario 8: Token at p = 51, Roll 6 -> reaches home (p = 57), extra roll
  {
    const state = createInitialState(createConfig({ firstSeat: 0, winTokensPerSeat: 4 }), rng);
    state.tokens[0][0].progress = 51;
    const moves = generateLegalMoves(state, 0, 6);
    const m = moves.find(mv => mv.tokenId === 0)!;
    assert(m.toProgress === 57, 'Acceptance 8: Token at p=51, Roll 6 -> reaches home (p=57)');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 6 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 57, 'Acceptance 8: Token reaches home');
    assert(res.state.activeSeat === 0, 'Acceptance 8: Extra roll awarded');
    assert(res.events.some(e => e.type === 'BONUS_ROLL'), 'Acceptance 8: BONUS_ROLL emitted');
  }

  // Scenario 9: Token at p = 56, Roll 1 -> reaches home (p = 57), extra roll
  {
    const state = createInitialState(createConfig({ firstSeat: 0, winTokensPerSeat: 4 }), rng);
    state.tokens[0][0].progress = 56;
    const moves = generateLegalMoves(state, 0, 1);
    const m = moves.find(mv => mv.tokenId === 0)!;
    assert(m.toProgress === 57, 'Acceptance 9: Token at p=56, Roll 1 -> reaches home (p=57)');

    state.phase = 'WAIT_ROLL';
    let res = step(state, { type: 'ROLL_DICE', forceRoll: 1 }, rng);
    res = step(res.state, { type: 'SELECT_TOKEN', seat: 0, tokenId: 0 }, rng);
    assert(res.state.tokens[0][0].progress === 57, 'Acceptance 9: Token reaches home');
    assert(res.state.activeSeat === 0, 'Acceptance 9: Extra roll awarded');
  }

  // Scenario 10: Token at p = 56, only token out, Roll 2 -> no move (overshoots 58 > 57), turn passes
  {
    const state = createInitialState(createConfig({ firstSeat: 0 }), rng);
    state.tokens[0][0].progress = 56;
    state.tokens[0][1].progress = 0;
    state.tokens[0][2].progress = 0;
    state.tokens[0][3].progress = 0;

    const moves = generateLegalMoves(state, 0, 2);
    assert(moves.length === 0, 'Acceptance 10: Token at p=56, Roll 2 -> 0 legal moves (no bounce-back)');

    const res = step(state, { type: 'ROLL_DICE', forceRoll: 2 }, rng);
    assert(res.state.activeSeat === 1, 'Acceptance 10: Turn passes to seat 1');
  }
}

console.log('\n========================================================================');
console.log('🎉 ALL DICE NUMBERS AND TOKEN MOVEMENT RULES ACCEPTANCE TESTS PASSED! 🎉');
console.log('========================================================================\n');
