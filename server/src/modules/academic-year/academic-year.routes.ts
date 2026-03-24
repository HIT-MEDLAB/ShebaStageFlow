import { Router } from 'express';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { authenticate } from '../../shared/middlewares/authenticate';
import { createAcademicYearSchema, updateAcademicYearSchema } from './academic-year.schema';
import { AcademicYearRepository } from './academic-year.repository';
import { AcademicYearService } from './academic-year.service';
import { createAcademicYearController } from './academic-year.controller';

const repository = new AcademicYearRepository();
const service = new AcademicYearService(repository);
const controller = createAcademicYearController(service);

export const academicYearRouter = Router();

academicYearRouter.use(authenticate);

academicYearRouter.get('/', controller.getAll);
academicYearRouter.get('/:id', controller.getById);
academicYearRouter.post('/', validateRequest(createAcademicYearSchema), controller.create);
academicYearRouter.patch('/:id', validateRequest(updateAcademicYearSchema), controller.update);
academicYearRouter.delete('/:id', controller.remove);
