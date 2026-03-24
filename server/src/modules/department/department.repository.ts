import prisma from '../../lib/prisma';
import type { Department } from '@prisma/client';

export interface IDepartmentRepository {
  findAll(): Promise<Department[]>;
}

export class DepartmentRepository implements IDepartmentRepository {
  async findAll(): Promise<Department[]> {
    return prisma.department.findMany({
      where: { isActive: true },
      include: { departmentConstraints: true },
      orderBy: { name: 'asc' },
    });
  }
}
