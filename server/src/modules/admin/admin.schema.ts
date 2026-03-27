import { z } from 'zod';

export const createAdminSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const updateAdminSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type CreateAdminDto = z.infer<typeof createAdminSchema>;
export type UpdateAdminDto = z.infer<typeof updateAdminSchema>;
