import { describe, it, expect } from 'vitest';
import { createHabitSchema } from '../validators/habits';

describe('habit validation', () => {
  it('valid habit', () => {
    const result = createHabitSchema.safeParse({
      title: 'Утренняя зарядка',
      description: '10 минут',
      emoji: '🏃',
      goal_days: 30,
    });
    expect(result.success).toBe(true);
  });

  it('empty title fails', () => {
    const result = createHabitSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('default values', () => {
    const result = createHabitSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emoji).toBe('📌');
      expect(result.data.goal_days).toBe(30);
    }
  });
});
