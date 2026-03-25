import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createIronConstraintFormSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('constraints:validation.nameRequired')),
    description: z.string().min(1, t('constraints:validation.descriptionRequired')),
  })
}

export type IronConstraintFormData = z.infer<ReturnType<typeof createIronConstraintFormSchema>>

export function createDateConstraintFormSchema(t: TFunction) {
  return z
    .object({
      name: z.string().min(1, t('constraints:validation.nameRequired')),
      description: z.string().min(1, t('constraints:validation.descriptionRequired')),
      startDate: z.string().min(1, t('constraints:validation.dateRequired')),
      endDate: z.string().min(1, t('constraints:validation.dateRequired')),
    })
    .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
      message: t('constraints:validation.endBeforeStart'),
      path: ['endDate'],
    })
}

export type DateConstraintFormData = z.infer<ReturnType<typeof createDateConstraintFormSchema>>

export function createDepartmentConstraintFormSchema(t: TFunction) {
  return z.object({
    morningCapacity: z.coerce.number().int().min(0, t('constraints:validation.capacityMin')),
    eveningCapacity: z.coerce.number().int().min(0, t('constraints:validation.capacityMin')),
    electiveCapacity: z.coerce.number().int().min(0, t('constraints:validation.capacityMin')),
    blockedStartDate: z.string().optional(),
    blockedEndDate: z.string().optional(),
  })
}

export type DepartmentConstraintFormData = z.infer<
  ReturnType<typeof createDepartmentConstraintFormSchema>
>

export function createUniversitySemesterFormSchema(t: TFunction) {
  return z
    .object({
      universityId: z.coerce.number().int().min(1, t('constraints:validation.universityRequired')),
      semesterStart: z.string().min(1, t('constraints:validation.dateRequired')),
      semesterEnd: z.string().min(1, t('constraints:validation.dateRequired')),
    })
    .refine((data) => new Date(data.semesterEnd) > new Date(data.semesterStart), {
      message: t('constraints:validation.endBeforeStart'),
      path: ['semesterEnd'],
    })
}

export type UniversitySemesterFormData = z.infer<
  ReturnType<typeof createUniversitySemesterFormSchema>
>
