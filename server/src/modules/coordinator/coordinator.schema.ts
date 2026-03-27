import { z } from 'zod';

export const createCoordinatorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const updateCoordinatorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// Export inferred types
export type CreateCoordinatorDto = z.infer<typeof createCoordinatorSchema>;
export type UpdateCoordinatorDto = z.infer<typeof updateCoordinatorSchema>;
