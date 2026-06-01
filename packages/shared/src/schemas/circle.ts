import { z } from 'zod';

export const moneyModeSchema = z.enum(['PLAY', 'REAL']);

export const createCircleSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  moneyMode: z.literal('PLAY').optional().default('PLAY'),
});

export const joinCircleSchema = z.object({
  inviteCode: z.string().min(4).max(20),
});

export const updateCircleSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  moneyMode: moneyModeSchema.optional(),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type JoinCircleInput = z.infer<typeof joinCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
