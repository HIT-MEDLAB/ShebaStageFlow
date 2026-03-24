import { z } from 'zod';

export const createUniversitySchema = z.object({
  name: z.string().min(1),
  priority: z.number().int().optional(),
});

export const updateUniversitySchema = z.object({
  name: z.string().min(1).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUniversityDto = z.infer<typeof createUniversitySchema>;
export type UpdateUniversityDto = z.infer<typeof updateUniversitySchema>;
