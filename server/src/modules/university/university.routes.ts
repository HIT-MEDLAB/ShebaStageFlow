import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticate } from '../../shared/middlewares/authenticate';
import { createUniversitySchema, updateUniversitySchema } from './university.schema';
import { UniversityRepository } from './university.repository';
import { UniversityService } from './university.service';
import { createUniversityController } from './university.controller';

const repository = new UniversityRepository();
const service = new UniversityService(repository);
const controller = createUniversityController(service);

export const universityRouter = Router();

universityRouter.use(authenticate);

universityRouter.get('/', controller.getAll);
universityRouter.get('/:id', controller.getById);
universityRouter.post('/', validateRequest(createUniversitySchema), controller.create);
universityRouter.patch('/:id', validateRequest(updateUniversitySchema), controller.update);
universityRouter.delete('/:id', controller.remove);
