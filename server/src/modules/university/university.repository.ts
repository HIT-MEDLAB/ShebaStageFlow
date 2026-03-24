import prisma from '../../lib/prisma';
import type { University } from '@prisma/client';
import type { CreateUniversityDto, UpdateUniversityDto } from './university.schema';

export interface IUniversityRepository {
  findAll(): Promise<University[]>;
  findById(id: number): Promise<University | null>;
  findByName(name: string): Promise<University | null>;
  create(data: CreateUniversityDto): Promise<University>;
  update(id: number, data: UpdateUniversityDto): Promise<University>;
  remove(id: number): Promise<University>;
}

export class UniversityRepository implements IUniversityRepository {
  async findAll(): Promise<University[]> {
    return prisma.university.findMany({ orderBy: { priority: 'asc' } });
  }

  async findById(id: number): Promise<University | null> {
    return prisma.university.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<University | null> {
    return prisma.university.findUnique({ where: { name } });
  }

  async create(data: CreateUniversityDto): Promise<University> {
    return prisma.university.create({ data });
  }

  async update(id: number, data: UpdateUniversityDto): Promise<University> {
    return prisma.university.update({ where: { id }, data });
  }

  async remove(id: number): Promise<University> {
    return prisma.university.delete({ where: { id } });
  }
}
