import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  otpToken: z.string().min(1),
  code: z.string().length(6),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
}).refine(
  (data) => !data.newPassword || data.currentPassword,
  { message: 'Current password is required to set a new password', path: ['currentPassword'] },
);

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
