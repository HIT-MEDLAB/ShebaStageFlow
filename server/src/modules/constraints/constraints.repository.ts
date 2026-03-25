import prisma from '../../lib/prisma';
import type {
  IronConstraint,
  DateConstraint,
  Department,
  DepartmentConstraint,
  UniversitySemester,
} from '@prisma/client';
import type {
  CreateIronConstraintDto,
  UpdateIronConstraintDto,
  CreateDateConstraintDto,
  UpdateDateConstraintDto,
  UpsertDepartmentConstraintDto,
} from './constraints.schema';

export interface IConstraintsRepository {
  // Iron Constraints
  findAllIron(): Promise<IronConstraint[]>;
  findIronById(id: number): Promise<IronConstraint | null>;
  createIron(data: CreateIronConstraintDto): Promise<IronConstraint>;
  updateIron(id: number, data: UpdateIronConstraintDto): Promise<IronConstraint>;
  deleteIron(id: number): Promise<IronConstraint>;

  // Date Constraints
  findAllDate(): Promise<DateConstraint[]>;
  findDateById(id: number): Promise<DateConstraint | null>;
  createDate(data: CreateDateConstraintDto): Promise<DateConstraint>;
  updateDate(id: number, data: UpdateDateConstraintDto): Promise<DateConstraint>;
  deleteDate(id: number): Promise<DateConstraint>;

  // Departments
  findAllDepartments(): Promise<Department[]>;
  findDepartmentConstraint(departmentId: number): Promise<DepartmentConstraint | null>;
  upsertDepartmentConstraint(
    departmentId: number,
    data: UpsertDepartmentConstraintDto,
  ): Promise<DepartmentConstraint>;

  // Semesters
  findSemestersByUniversity(universityId: number): Promise<UniversitySemester[]>;
  findSemesterById(id: number): Promise<UniversitySemester | null>;
  createSemester(data: {
    universityId: number;
    semesterStart: Date;
    semesterEnd: Date;
    year: number;
  }): Promise<UniversitySemester>;
  updateSemester(
    id: number,
    data: { semesterStart?: Date; semesterEnd?: Date; year?: number },
  ): Promise<UniversitySemester>;
}

export class ConstraintsRepository implements IConstraintsRepository {
  // ─── Iron Constraints ────────────────────────────────────

  async findAllIron(): Promise<IronConstraint[]> {
    return prisma.ironConstraint.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findIronById(id: number): Promise<IronConstraint | null> {
    return prisma.ironConstraint.findUnique({ where: { id } });
  }

  async createIron(data: CreateIronConstraintDto): Promise<IronConstraint> {
    return prisma.ironConstraint.create({ data });
  }

  async updateIron(id: number, data: UpdateIronConstraintDto): Promise<IronConstraint> {
    return prisma.ironConstraint.update({ where: { id }, data });
  }

  async deleteIron(id: number): Promise<IronConstraint> {
    return prisma.ironConstraint.delete({ where: { id } });
  }

  // ─── Date Constraints ────────────────────────────────────

  async findAllDate(): Promise<DateConstraint[]> {
    return prisma.dateConstraint.findMany({ orderBy: { startDate: 'asc' } });
  }

  async findDateById(id: number): Promise<DateConstraint | null> {
    return prisma.dateConstraint.findUnique({ where: { id } });
  }

  async createDate(data: CreateDateConstraintDto): Promise<DateConstraint> {
    return prisma.dateConstraint.create({ data });
  }

  async updateDate(id: number, data: UpdateDateConstraintDto): Promise<DateConstraint> {
    return prisma.dateConstraint.update({ where: { id }, data });
  }

  async deleteDate(id: number): Promise<DateConstraint> {
    return prisma.dateConstraint.delete({ where: { id } });
  }

  // ─── Departments ─────────────────────────────────────────

  async findAllDepartments(): Promise<Department[]> {
    return prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDepartmentConstraint(departmentId: number): Promise<DepartmentConstraint | null> {
    return prisma.departmentConstraint.findFirst({ where: { departmentId } });
  }

  async upsertDepartmentConstraint(
    departmentId: number,
    data: UpsertDepartmentConstraintDto,
  ): Promise<DepartmentConstraint> {
    const existing = await this.findDepartmentConstraint(departmentId);

    if (existing) {
      return prisma.departmentConstraint.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.departmentConstraint.create({
      data: { departmentId, ...data },
    });
  }

  // ─── Semesters ───────────────────────────────────────────

  async findSemestersByUniversity(universityId: number): Promise<UniversitySemester[]> {
    return prisma.universitySemester.findMany({
      where: { universityId },
      orderBy: { year: 'desc' },
    });
  }

  async findSemesterById(id: number): Promise<UniversitySemester | null> {
    return prisma.universitySemester.findUnique({ where: { id } });
  }

  async createSemester(data: {
    universityId: number;
    semesterStart: Date;
    semesterEnd: Date;
    year: number;
  }): Promise<UniversitySemester> {
    return prisma.universitySemester.create({ data });
  }

  async updateSemester(
    id: number,
    data: { semesterStart?: Date; semesterEnd?: Date; year?: number },
  ): Promise<UniversitySemester> {
    return prisma.universitySemester.update({ where: { id }, data });
  }
}
