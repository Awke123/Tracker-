import { describe, it, expect } from 'vitest';

function xpToReachLevel(level: number): number {
  const XP_PER_LEVEL = 100;
  const LEVEL_MULTIPLIER = 1.5;
  if (level <= 1) return 0;
  return Math.floor(
    (XP_PER_LEVEL * (Math.pow(LEVEL_MULTIPLIER, level - 1) - 1)) /
      (LEVEL_MULTIPLIER - 1)
  );
}

function levelFromExperience(exp: number): number {
  let lvl = 1;
  while (xpToReachLevel(lvl + 1) <= exp) lvl++;
  return lvl;
}

describe('gamification', () => {
  it('xpToReachLevel: level 1 = 0', () => {
    expect(xpToReachLevel(1)).toBe(0);
  });

  it('xpToReachLevel: level 2 = 100', () => {
    expect(xpToReachLevel(2)).toBe(100);
  });

  it('levelFromExperience: 0 xp = level 1', () => {
    expect(levelFromExperience(0)).toBe(1);
  });

  it('levelFromExperience: 100 xp = level 2', () => {
    expect(levelFromExperience(100)).toBe(2);
  });

  it('levelFromExperience: 99 xp = level 1', () => {
    expect(levelFromExperience(99)).toBe(1);
  });
});
