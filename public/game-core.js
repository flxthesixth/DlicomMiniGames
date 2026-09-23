// DLICOM DROP — pure game state. No DOM, no canvas. Deterministic given seed + inputs.
export function newGame(seed = 1, shields = 0) {
  return {
    seed, shields,
    score: 0, combo: 0, bestCombo: 0,
    multiplier: 1, surge: 0,
    distance: 0, over: false,
  };
}

export function advance(state, { collect = false, hit = false, dt = 0 }) {
  if (state.over) return state;
  const next = { ...state, combo: state.combo, score: state.score, surge: state.surge };
  next.distance = state.distance + dt;

  if (hit) {
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
