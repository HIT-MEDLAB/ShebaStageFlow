import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { createAdminController } from './admin.controller';
import { createAdminSchema, updateAdminSchema } from './admin.schema';

const repository = new AdminRepository();
const service = new AdminService(repository);
const controller = createAdminController(service);

const superAdminOnly = authorize('SUPER_ADMIN');

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(superAdminOnly);

adminRouter.get('/', controller.getAll);
adminRouter.post('/', validateRequest(createAdminSchema), controller.create);
adminRouter.patch('/:id', validateRequest(updateAdminSchema), controller.update);
adminRouter.delete('/:id', controller.remove);
