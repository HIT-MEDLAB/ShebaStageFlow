import { z } from 'zod'

export const softConstraintFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priority: z.coerce.number().int().min(0).optional(),
  departmentId: z.coerce.number().int().positive().nullable().optional(),
  universityId: z.coerce.number().int().positive().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
})

export type SoftConstraintFormValues = z.infer<typeof softConstraintFormSchema>

export const departmentFormSchema = z.object({
  name: z.string().min(1),
  hasMorningShift: z.boolean().optional(),
  hasEveningShift: z.boolean().optional(),
  morningCapacity: z.coerce.number().int().min(0),
  eveningCapacity: z.coerce.number().int().min(0).optional(),
  electiveCapacity: z.coerce.number().int().min(0).optional(),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>

export const universityFormSchema = z.object({
  name: z.string().min(1),
  priority: z.coerce.number().int().min(0).optional(),
  semesterStart: z.string().min(1),
  semesterEnd: z.string().min(1),
  year: z.coerce.number().int().positive(),
})

export type UniversityFormValues = z.infer<typeof universityFormSchema>
