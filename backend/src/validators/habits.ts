import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(255),
  description: z.string().max(1000).optional(),
  emoji: z.string().max(10).optional().default('📌'),
  goal_days: z.number().int().min(1).max(365).optional().default(30),
});

export const updateHabitSchema = createHabitSchema.partial();
