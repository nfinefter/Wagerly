import { z } from 'zod';

export const betTypeSchema = z.enum(['YES_NO', 'OVER_UNDER', 'MULTIPLE_CHOICE']);

export const betStatusSchema = z.enum([
  'DRAFT',
  'OPEN',
  'LOCKED',
  'SETTLED',
  'CANCELLED',
  'DISPUTED',
]);

export const createBetSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    category: z.string().max(50).optional(),
    imageUrl: z.string().url().optional(),
    betType: betTypeSchema.default('YES_NO'),
    endDate: z.coerce.date().refine((d) => d > new Date(), {
      message: 'End date must be in the future',
    }),
    options: z.array(z.string().min(1).max(100)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.betType === 'MULTIPLE_CHOICE') {
      const opts = data.options ?? [];
      if (opts.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Multiple choice bets need at least 2 options',
          path: ['options'],
        });
      }
    }
  });

export const updateBetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  imageUrl: z.string().url().nullable().optional(),
  endDate: z.coerce.date().optional(),
});

export const updateBetStatusSchema = z.object({
  status: z.enum(['LOCKED', 'SETTLED', 'CANCELLED', 'DISPUTED']),
  winningOptionId: z.string().uuid().optional(),
});

export const placeBetSchema = z.object({
  betOptionId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
});

export type CreateBetInput = z.infer<typeof createBetSchema>;
export type UpdateBetInput = z.infer<typeof updateBetSchema>;
export type UpdateBetStatusInput = z.infer<typeof updateBetStatusSchema>;
export type PlaceBetInput = z.infer<typeof placeBetSchema>;
