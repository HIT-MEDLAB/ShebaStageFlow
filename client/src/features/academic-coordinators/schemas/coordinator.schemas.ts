import { z } from 'zod'

export const coordinatorFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
})

export type CoordinatorFormValues = z.infer<typeof coordinatorFormSchema>
