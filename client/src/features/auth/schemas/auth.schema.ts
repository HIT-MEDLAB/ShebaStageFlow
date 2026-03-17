import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('auth:validation.emailInvalid')),
    password: z.string().min(6, t('auth:validation.passwordMin')),
    rememberMe: z.boolean(),
  })
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>

export function createForgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('auth:validation.emailInvalid')),
  })
}

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>
