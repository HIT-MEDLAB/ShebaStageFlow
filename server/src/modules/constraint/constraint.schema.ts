import { z } from 'zod';

export const toggleConstraintSchema = z.object({
  isActive: z.boolean(),
});

export const createSoftConstraintSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priority: z.number().int().min(0).optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  universityId: z.number().int().positive().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const updateSoftConstraintSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  priority: z.number().int().min(0).optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  universityId: z.number().int().positive().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  academicYearId: z.number().int().positive(),
  hasMorningShift: z.boolean().optional(),
  hasEveningShift: z.boolean().optional(),
  morningCapacity: z.number().int().min(0),
  eveningCapacity: z.number().int().min(0).optional(),
  electiveCapacity: z.number().int().min(0).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  academicYearId: z.number().int().positive().optional(),
  hasMorningShift: z.boolean().optional(),
  hasEveningShift: z.boolean().optional(),
  morningCapacity: z.number().int().min(0).optional(),
  eveningCapacity: z.number().int().min(0).optional(),
  electiveCapacity: z.number().int().min(0).optional(),
});

export const createUniversityWithSemesterSchema = z.object({
  name: z.string().min(1),
  priority: z.number().int().min(0).optional(),
  semesterStart: z.coerce.date(),
  semesterEnd: z.coerce.date(),
});

export const updateUniversityWithSemesterSchema = z.object({
  name: z.string().min(1).optional(),
  priority: z.number().int().min(0).optional(),
  semesterStart: z.coerce.date().optional(),
  semesterEnd: z.coerce.date().optional(),
});

export const setDepartmentActiveSchema = z.object({
  isActive: z.boolean(),
  academicYearId: z.number().int().positive(),
});

export const setUniversityActiveSchema = z.object({
  isActive: z.boolean(),
  year: z.number().int().positive(),
});

export const copyYearSchema = z.object({
  targetAcademicYearId: z.number().int().positive(),
  sourceAcademicYearId: z.number().int().positive(),
});

// Export inferred types
export type ToggleConstraintDto = z.infer<typeof toggleConstraintSchema>;
export type CreateSoftConstraintDto = z.infer<typeof createSoftConstraintSchema>;
export type UpdateSoftConstraintDto = z.infer<typeof updateSoftConstraintSchema>;
export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
export type CreateUniversityWithSemesterDto = z.infer<typeof createUniversityWithSemesterSchema>;
export type UpdateUniversityWithSemesterDto = z.infer<typeof updateUniversityWithSemesterSchema>;
export type SetDepartmentActiveDto = z.infer<typeof setDepartmentActiveSchema>;
export type SetUniversityActiveDto = z.infer<typeof setUniversityActiveSchema>;
export type CopyYearDto = z.infer<typeof copyYearSchema>;
