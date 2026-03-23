import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticate } from '../../shared/middlewares/authenticate';
import { loginSchema } from './auth.schema';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { createAuthController } from './auth.controller';

const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = createAuthController(service);

export const authRouter = Router();

authRouter.post('/login', validateRequest(loginSchema), controller.login);
authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout', controller.logout);
