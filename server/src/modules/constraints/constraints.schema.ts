import { z } from 'zod';

// ─── Iron Constraints ────────────────────────────────────

export const createIronConstraintSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export const updateIronConstraintSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateIronConstraintDto = z.infer<typeof createIronConstraintSchema>;
export type UpdateIronConstraintDto = z.infer<typeof updateIronConstraintSchema>;

// ─── Date Constraints ────────────────────────────────────

export const createDateConstraintSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  });

export const updateDateConstraintSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    },
  );

export type CreateDateConstraintDto = z.infer<typeof createDateConstraintSchema>;
export type UpdateDateConstraintDto = z.infer<typeof updateDateConstraintSchema>;

// ─── Department Constraints ──────────────────────────────

export const upsertDepartmentConstraintSchema = z.object({
  morningCapacity: z.number().int().min(0),
  eveningCapacity: z.number().int().min(0),
  electiveCapacity: z.number().int().min(0),
  blockedStartDate: z.coerce.date().nullable().optional(),
  blockedEndDate: z.coerce.date().nullable().optional(),
});

export type UpsertDepartmentConstraintDto = z.infer<typeof upsertDepartmentConstraintSchema>;

// ─── University Semesters ────────────────────────────────

export const createSemesterSchema = z
  .object({
    universityId: z.number().int(),
    semesterStart: z.coerce.date(),
    semesterEnd: z.coerce.date(),
  })
  .refine((data) => data.semesterEnd > data.semesterStart, {
    message: 'Semester end must be after semester start',
    path: ['semesterEnd'],
  });

export const updateSemesterSchema = z
  .object({
    semesterStart: z.coerce.date().optional(),
    semesterEnd: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.semesterStart && data.semesterEnd) {
        return data.semesterEnd > data.semesterStart;
      }
      return true;
    },
    {
      message: 'Semester end must be after semester start',
      path: ['semesterEnd'],
    },
  );

export type CreateSemesterDto = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterDto = z.infer<typeof updateSemesterSchema>;
