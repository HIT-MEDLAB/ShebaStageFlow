import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateAcademicYearSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;
