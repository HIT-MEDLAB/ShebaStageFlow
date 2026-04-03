import prisma from '../../lib/prisma';
import type {
  DepartmentConstraint,
  IronConstraint,
  Holiday,
  SoftConstraint,
  DateConstraint,
} from '@prisma/client';
import type {
  CreateSoftConstraintDto,
  UpdateSoftConstraintDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateUniversityWithSemesterDto,
  UpdateUniversityWithSemesterDto,
} from './constraint.schema';

export interface IConstraintRepository {
  findDepartmentConstraints(): Promise<(DepartmentConstraint & { department: { id: number; name: string } })[]>;
  findIronConstraints(activeOnly?: boolean): Promise<IronConstraint[]>;
  findHolidays(years: number[]): Promise<Holiday[]>;
}

export class ConstraintRepository implements IConstraintRepository {
  // ─── Date Constraints (scheduler) ──────────────────────────

  async findActiveDateConstraints() {
    return prisma.dateConstraint.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findSemestersByYears(years: number[]) {
    return prisma.universitySemester.findMany({
      where: { year: { in: years } },
      include: { university: { select: { id: true, name: true } } },
    });
  }

  // ─── Existing Methods (kept for scheduler) ─────────────────

  async findDepartmentConstraints() {
    return prisma.departmentConstraint.findMany({
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findIronConstraints(activeOnly?: boolean): Promise<IronConstraint[]> {
    return prisma.ironConstraint.findMany({
      where: activeOnly ? { isActive: true } : undefined,
    });
  }

  async findHolidays(years: number[]): Promise<Holiday[]> {
    return prisma.holiday.findMany({
      where: { year: { in: years } },
      orderBy: { date: 'asc' },
    });
  }

  // ─── Iron Constraints ──────────────────────────────────────

  async findAllIronConstraints(): Promise<IronConstraint[]> {
    return prisma.ironConstraint.findMany({ orderBy: { id: 'asc' } });
  }

  async findIronConstraintById(id: number) {
    return prisma.ironConstraint.findUnique({ where: { id } });
  }

  async toggleIronConstraint(id: number, isActive: boolean) {
    return prisma.ironConstraint.update({ where: { id }, data: { isActive } });
  }

  // ─── Date Constraints ──────────────────────────────────────

  async findAllDateConstraints(): Promise<DateConstraint[]> {
    return prisma.dateConstraint.findMany({ orderBy: { startDate: 'asc' } });
  }

  async findDateConstraintById(id: number) {
    return prisma.dateConstraint.findUnique({ where: { id } });
  }

  async toggleDateConstraint(id: number, isActive: boolean) {
    return prisma.dateConstraint.update({ where: { id }, data: { isActive } });
  }

  // ─── Soft Constraints ──────────────────────────────────────

  async findActiveSoftConstraintsWithDates() {
    return prisma.softConstraint.findMany({
      where: {
        isActive: true,
        startDate: { not: null },
        endDate: { not: null },
      },
      orderBy: { priority: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findAllSoftConstraints() {
    return prisma.softConstraint.findMany({
      orderBy: { priority: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        university: { select: { id: true, name: true } },
      },
    });
  }

  async findSoftConstraintById(id: number) {
    return prisma.softConstraint.findUnique({ where: { id } });
  }

  async createSoftConstraint(data: CreateSoftConstraintDto) {
    return prisma.softConstraint.create({ data });
  }

  async updateSoftConstraint(id: number, data: UpdateSoftConstraintDto) {
    return prisma.softConstraint.update({ where: { id }, data });
  }

  async deleteSoftConstraint(id: number) {
    return prisma.softConstraint.delete({ where: { id } });
  }

  async toggleSoftConstraint(id: number, isActive: boolean) {
    return prisma.softConstraint.update({ where: { id }, data: { isActive } });
  }

  // ─── Holidays ──────────────────────────────────────────────

  async findAllHolidays(): Promise<Holiday[]> {
    return prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  }

  async toggleHoliday(id: number, isActive: boolean) {
    return prisma.holiday.update({ where: { id }, data: { isActive } });
  }

  async findHolidayById(id: number) {
    return prisma.holiday.findUnique({ where: { id } });
  }

  // ─── Departments (transactional) ───────────────────────────

  async findAllDepartmentsWithConstraints() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { departmentConstraints: true },
    });
  }

  async createDepartmentWithConstraint(data: CreateDepartmentDto) {
    return prisma.$transaction(async (tx) => {
      const hasMorning = data.hasMorningShift ?? true;
      const hasEvening = data.hasEveningShift ?? false;

      const department = await tx.department.create({
        data: {
          name: data.name,
          hasMorningShift: hasMorning,
          hasEveningShift: hasEvening,
        },
      });

      await tx.departmentConstraint.create({
        data: {
          departmentId: department.id,
          morningCapacity: hasMorning ? data.morningCapacity : 0,
          eveningCapacity: hasEvening ? (data.eveningCapacity ?? 0) : 0,
          electiveCapacity: data.electiveCapacity ?? 0,
        },
      });

      return prisma.department.findUniqueOrThrow({
        where: { id: department.id },
        include: { departmentConstraints: true },
      });
    });
  }

  async updateDepartmentWithConstraint(id: number, data: UpdateDepartmentDto) {
    return prisma.$transaction(async (tx) => {
      await tx.department.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.hasMorningShift !== undefined && { hasMorningShift: data.hasMorningShift }),
          ...(data.hasEveningShift !== undefined && { hasEveningShift: data.hasEveningShift }),
        },
      });

      // Read back the current shift flags to enforce capacity consistency
      const dept = await tx.department.findUniqueOrThrow({ where: { id } });

      const constraintData: Record<string, number> = {};
      if (data.morningCapacity !== undefined) constraintData['morningCapacity'] = data.morningCapacity;
      if (data.eveningCapacity !== undefined) constraintData['eveningCapacity'] = data.eveningCapacity;
      if (data.electiveCapacity !== undefined) constraintData['electiveCapacity'] = data.electiveCapacity;

      // Force capacity to 0 when the shift is disabled
      if (!dept.hasMorningShift) constraintData['morningCapacity'] = 0;
      if (!dept.hasEveningShift) constraintData['eveningCapacity'] = 0;

      if (Object.keys(constraintData).length > 0) {
        const existing = await tx.departmentConstraint.findFirst({ where: { departmentId: id } });
        if (existing) {
          await tx.departmentConstraint.update({ where: { id: existing.id }, data: constraintData });
        } else {
          await tx.departmentConstraint.create({
            data: {
              departmentId: id,
              morningCapacity: dept.hasMorningShift ? (data.morningCapacity ?? 1) : 0,
              eveningCapacity: dept.hasEveningShift ? (data.eveningCapacity ?? 0) : 0,
              electiveCapacity: data.electiveCapacity ?? 0,
            },
          });
        }
      }

      return prisma.department.findUniqueOrThrow({
        where: { id },
        include: { departmentConstraints: true },
      });
    });
  }

  // ─── Universities (transactional) ──────────────────────────

  async findAllUniversitiesWithSemesters() {
    return prisma.university.findMany({
      orderBy: { priority: 'asc' },
      include: { semesters: { orderBy: { year: 'desc' } } },
    });
  }

  async createUniversityWithSemester(data: CreateUniversityWithSemesterDto) {
    return prisma.$transaction(async (tx) => {
      const university = await tx.university.create({
        data: {
          name: data.name,
          priority: data.priority ?? 0,
        },
      });

      await tx.universitySemester.create({
        data: {
          universityId: university.id,
          semesterStart: data.semesterStart,
          semesterEnd: data.semesterEnd,
          year: data.year,
        },
      });

      return prisma.university.findUniqueOrThrow({
        where: { id: university.id },
        include: { semesters: { orderBy: { year: 'desc' } } },
      });
    });
  }

  async updateUniversityWithSemester(id: number, data: UpdateUniversityWithSemesterDto) {
    return prisma.$transaction(async (tx) => {
      const universityData: Record<string, unknown> = {};
      if (data.name !== undefined) universityData['name'] = data.name;
      if (data.priority !== undefined) universityData['priority'] = data.priority;

      if (Object.keys(universityData).length > 0) {
        await tx.university.update({ where: { id }, data: universityData });
      }

      if (data.semesterStart !== undefined || data.semesterEnd !== undefined || data.year !== undefined) {
        const year = data.year;
        if (year) {
          const existing = await tx.universitySemester.findUnique({
            where: { universityId_year: { universityId: id, year } },
          });

          if (existing) {
            await tx.universitySemester.update({
              where: { id: existing.id },
              data: {
                ...(data.semesterStart !== undefined && { semesterStart: data.semesterStart }),
                ...(data.semesterEnd !== undefined && { semesterEnd: data.semesterEnd }),
              },
            });
          } else {
            if (data.semesterStart && data.semesterEnd) {
              await tx.universitySemester.create({
                data: {
                  universityId: id,
                  semesterStart: data.semesterStart,
                  semesterEnd: data.semesterEnd,
                  year,
                },
              });
            }
          }
        }
      }

      return prisma.university.findUniqueOrThrow({
        where: { id },
        include: { semesters: { orderBy: { year: 'desc' } } },
      });
    });
  }
}
