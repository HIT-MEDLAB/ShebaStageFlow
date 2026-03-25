import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createStudentSchema(t: TFunction) {
  return z.object({
    firstName: z.string().min(1, t('scheduler:dialogs.validation.firstNameRequired')),
    lastName: z.string().min(1, t('scheduler:dialogs.validation.lastNameRequired')),
    nationalId: z.string().min(1, t('scheduler:dialogs.validation.nationalIdRequired')),
    phone: z.string().optional().or(z.literal('')),
    email: z
      .string()
      .email(t('scheduler:dialogs.validation.emailInvalid'))
      .optional()
      .or(z.literal('')),
  })
}

export type StudentFormData = z.infer<ReturnType<typeof createStudentSchema>>
