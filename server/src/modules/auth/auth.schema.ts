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
