// DILI RUN — pure game state. No DOM, no three.js. Deterministic given seed + inputs.
// Three lanes: index 0 (left), 1 (center), 2 (right).

export const LANES = 3;

export function newGame(seed = 1, shields = 0) {
  return {
    seed, shields,
    lane: 1,
    score: 0, scoreFraction: 0, combo: 0, bestCombo: 0, puzzlePieces: 0,
    multiplier: 1, comboMultiplier: 1, surge: 0, jump: 0, slide: 0,
    lives: 3, invulnerable: 0,
    distance: 0, over: false, dodged: false, destroyed: false, damaged: false,
  };
}

export function seededRandom(seed, sequence) {
  const x = Math.imul(sequence + 0x9E3779B9, 0x85EBCA6B) ^ seed;
  const y = Math.imul(x ^ (x >>> 13), 0xC2B2AE35);
  return ((y ^ (y >>> 16)) >>> 0) / 4294967296;
}

export function difficultyLevel(score) {
  // Level 1..6: rises every 500 score. Drives spawn mix and speed pacing.
  return Math.min(6, 1 + Math.floor(Math.max(0, score) / 500));
}

export function advance(state, { lane = 0, collect = false, gem = false, puzzle = false, quizCorrect = false, nearMiss = false, hit = false, hitType = null, jump = false, slide = false, dt = 0 } = {}) {
  if (state.over) return state;
  const next = { ...state, score: state.score, surge: state.surge, combo: state.combo, dodged: false, destroyed: false, damaged: false };
  next.distance = state.distance + dt;

  // Input must take effect before collision in this same simulation step.
  if (jump && next.jump <= 0 && next.slide <= 0) next.jump = .62;
  if (slide && next.slide <= 0 && next.jump <= 0) next.slide = .48;
  const airborne = next.jump > 0;
  const sliding = next.slide > 0;
  const actionDodge = hit && (hitType === 'ground' ? airborne : hitType === 'flying' ? sliding : false);
  const protectedHit = hit && next.invulnerable > 0;
  next.dodged = actionDodge || protectedHit;
  const effectiveHit = hit && !next.dodged;
  if (next.jump > 0) next.jump = Math.max(0, next.jump - dt);
  if (next.slide > 0) next.slide = Math.max(0, next.slide - dt);
  if (next.invulnerable > 0) next.invulnerable = Math.max(0, next.invulnerable - dt);

  if (lane) {
    next.lane = Math.max(0, Math.min(LANES - 1, state.lane + lane));
  }

  if (effectiveHit) {
    if (next.surge > 0) {
      next.destroyed = true;
    } else {
      next.lives -= 1;
      next.combo = 0;
      next.comboMultiplier = 1;
      next.damaged = true;
      if (next.lives <= 0) {
        next.over = true;
        return next;
      }
      next.invulnerable = 2;
    }
  }

  if (collect || gem || nearMiss || actionDodge || quizCorrect) {
    next.combo += 1;
    next.comboMultiplier = Math.min(4, 1 + Math.floor(next.combo / 5));
    next.bestCombo = Math.max(next.bestCombo, next.combo);
    const base = gem ? 50 : quizCorrect ? 25 : nearMiss ? 15 : 10;
    next.score += base * next.multiplier * next.comboMultiplier;
  }

  if (puzzle) {
    next.puzzlePieces += 1;
    if (next.puzzlePieces >= 3) {
      next.puzzlePieces = 0;
      next.surge = 5;
      next.multiplier = 2;
    }
  }

  if (next.surge > 0) {
    next.surge = Math.max(0, next.surge - dt);
    if (next.surge === 0) {
      next.multiplier = 1;
      next.combo = 0;
    }
  }

  next.scoreFraction = state.scoreFraction + 2 * dt; // distance points
  const whole = Math.floor(next.scoreFraction);
  if (whole) { next.score += whole; next.scoreFraction -= whole; }
  return next;
}
