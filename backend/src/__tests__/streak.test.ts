import { describe, it, expect } from 'vitest';

function calculateStreak(dates: string[]): number {
  const dateSet = new Set(dates);
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  const d = new Date(today);
  while (dateSet.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

describe('streak calculation', () => {
  it('empty dates = 0 streak', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('today only = 1 streak', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(calculateStreak([today])).toBe(1);
  });

  it('consecutive days', () => {
    const today = new Date();
    const dates = [
      today.toISOString().slice(0, 10),
      new Date(today.getTime() - 86400000).toISOString().slice(0, 10),
      new Date(today.getTime() - 86400000 * 2).toISOString().slice(0, 10),
    ];
    expect(calculateStreak(dates)).toBe(3);
  });
});
