import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createAssignmentSchema(t: TFunction) {
  return z
    .object({
      departmentId: z.number({
        required_error: t('scheduler:dialogs.validation.departmentRequired'),
      }),
      startDate: z
        .date({ required_error: t('scheduler:dialogs.validation.startDateRequired') })
        .refine((d) => d.getDay() === 0, {
          message: t('scheduler:dialogs.validation.mustBeSunday'),
        }),
      endDate: z
        .date({ required_error: t('scheduler:dialogs.validation.endDateRequired') })
        .refine((d) => d.getDay() === 4, {
          message: t('scheduler:dialogs.validation.mustBeThursday'),
        }),
      universityId: z.number({
        required_error: t('scheduler:dialogs.validation.universityRequired'),
      }),
      type: z.enum(['GROUP', 'ELECTIVE'], {
        required_error: t('scheduler:dialogs.validation.typeRequired'),
      }),
      shiftType: z.enum(['MORNING', 'EVENING'], {
        required_error: t('scheduler:dialogs.validation.shiftRequired'),
      }),
      studentCount: z.number().positive().optional(),
      yearInProgram: z
        .number({ required_error: t('scheduler:dialogs.validation.yearRequired') })
        .min(3)
        .max(6),
      tutorName: z.string().optional(),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: t('scheduler:dialogs.validation.endAfterStart'),
      path: ['endDate'],
    })
}

export type AssignmentFormData = z.infer<ReturnType<typeof createAssignmentSchema>>
