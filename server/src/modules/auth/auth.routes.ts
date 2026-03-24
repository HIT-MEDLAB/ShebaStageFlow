import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticate } from '../../shared/middlewares/authenticate';
import { loginSchema, verifyOtpSchema } from './auth.schema';
import { AuthRepository } from './auth.repository';
import { OtpRepository } from './otp.repository';
import { AuthService } from './auth.service';
import { createAuthController } from './auth.controller';

const authRepository = new AuthRepository();
const otpRepository = new OtpRepository();
const service = new AuthService(authRepository, otpRepository);
const controller = createAuthController(service);

export const authRouter = Router();

authRouter.post('/login', validateRequest(loginSchema), controller.login);
authRouter.post('/verify-otp', validateRequest(verifyOtpSchema), controller.verifyOtp);
authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout', controller.logout);
