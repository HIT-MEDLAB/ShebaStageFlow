import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';
import { authRouter } from './modules/auth/auth.routes';
import { universityRouter } from './modules/university/university.routes';
import { academicYearRouter } from './modules/academic-year/academic-year.routes';
import { departmentRouter } from './modules/department/department.routes';
import { assignmentRouter } from './modules/assignment/assignment.routes';
import { constraintRouter } from './modules/constraint/constraint.routes';
import { coordinatorRouter } from './modules/coordinator/coordinator.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { statisticsRouter } from './modules/statistics/statistics.routes';
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CLIENT_URL'] || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes
app.use('/api/auth', authRouter);
app.use('/api/universities', universityRouter);
app.use('/api/academic-years', academicYearRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/constraints', constraintRouter);
app.use('/api/coordinators', coordinatorRouter);
app.use('/api/admins', adminRouter);
app.use('/api/statistics', statisticsRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { prisma };
export default app;
