// DLICOM RUNNER — pure game state. No DOM, no three.js. Deterministic given seed + inputs.
// Three lanes: index 0 (left), 1 (center), 2 (right).

export const LANES = 3;

export function newGame(seed = 1, shields = 0) {
  return {
    seed, shields,
    lane: 1,
    score: 0, combo: 0, bestCombo: 0,
    multiplier: 1, surge: 0, jump: 0, slide: 0,
    distance: 0, over: false, dodged: false,
  };
}

export function difficultyLevel(score) {
  // Level 1..6: rises every 500 score. Drives spawn mix and speed pacing.
  return Math.min(6, 1 + Math.floor(Math.max(0, score) / 500));
}

export function advance(state, { lane = 0, collect = false, hit = false, hitType = null, jump = false, slide = false, dt = 0 } = {}) {
  if (state.over) return state;
  const next = { ...state, score: state.score, surge: state.surge, combo: state.combo, dodged: false };
  next.distance = state.distance + dt;

  // Input must take effect before collision in this same simulation step.
  if (jump && next.jump <= 0 && next.slide <= 0) next.jump = .62;
  if (slide && next.slide <= 0 && next.jump <= 0) next.slide = .48;
  const airborne = next.jump > 0;
  const sliding = next.slide > 0;
  const dodged = hit && (hitType === 'ground' ? airborne : hitType === 'flying' ? sliding : false);
  next.dodged = dodged;
  const effectiveHit = hit && !dodged;
  if (next.jump > 0) next.jump = Math.max(0, next.jump - dt);
  if (next.slide > 0) next.slide = Math.max(0, next.slide - dt);

  if (lane) {
    next.lane = Math.max(0, Math.min(LANES - 1, state.lane + lane));
  }

  if (effectiveHit) {
    if (next.surge > 0) {
      // surge = invincible, obstacle passes through
    } else if (next.shields > 0) {
      next.shields -= 1;
      next.combo = 0;
    } else {
      next.over = true;
      return next;
    }
  }

  if (collect) {
    next.combo += 1;
    next.bestCombo = Math.max(next.bestCombo, next.combo);
    if (next.combo > 0 && next.combo % 3 === 0 && next.surge <= 0) {
      next.surge = 5; // SIGNAL SURGE: 5s invincible double points
      next.multiplier = 2;
    }
    next.score += 10 * next.multiplier;
  }

  if (next.surge > 0) {
    next.surge = Math.max(0, next.surge - dt);
    if (next.surge === 0) {
      next.multiplier = 1;
      next.combo = 0;
    }
  }

  next.score += Math.round(2 * dt); // distance points
  return next;
}
