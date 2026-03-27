import { z } from 'zod'

export const adminFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
})

export type AdminFormValues = z.infer<typeof adminFormSchema>
