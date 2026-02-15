import { z } from 'zod';

export const createPollSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  options: z.array(z.string().min(1).max(200)).min(2, 'At least 2 options required').max(10),
  expiresAt: z.string().datetime('Invalid expiration date')
});

export const voteSchema = z.object({
  optionId: z.string().uuid('Invalid option ID')
});
