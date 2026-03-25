import prisma from '../../lib/prisma';
import type { AcademicYear } from '@prisma/client';
import type { CreateAcademicYearDto, UpdateAcademicYearDto } from './academic-year.schema';

export interface IAcademicYearRepository {
  findAll(): Promise<AcademicYear[]>;
  findById(id: number): Promise<AcademicYear | null>;
  findByName(name: string): Promise<AcademicYear | null>;
  create(data: CreateAcademicYearDto): Promise<AcademicYear>;
  update(id: number, data: UpdateAcademicYearDto): Promise<AcademicYear>;
  remove(id: number): Promise<AcademicYear>;
}

export class AcademicYearRepository implements IAcademicYearRepository {
  async findAll(): Promise<AcademicYear[]> {
    return prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
  }

  async findById(id: number): Promise<AcademicYear | null> {
    return prisma.academicYear.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<AcademicYear | null> {
    return prisma.academicYear.findUnique({ where: { name } });
  }

  async create(data: CreateAcademicYearDto): Promise<AcademicYear> {
    return prisma.academicYear.create({ data });
  }

  async update(id: number, data: UpdateAcademicYearDto): Promise<AcademicYear> {
    return prisma.academicYear.update({ where: { id }, data });
  }

  async remove(id: number): Promise<AcademicYear> {
    return prisma.academicYear.delete({ where: { id } });
  }
}
