import prisma from '../../lib/prisma';
import type {
  DepartmentConstraint,
  IronConstraint,
  Holiday,
  SoftConstraint,
  DateConstraint,
} from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import type {
  CreateSoftConstraintDto,
  UpdateSoftConstraintDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateUniversityWithSemesterDto,
  UpdateUniversityWithSemesterDto,
} from './constraint.schema';

export interface IConstraintRepository {
  findDepartmentConstraints(academicYearId?: number): Promise<(DepartmentConstraint & { department: { id: number; name: string } })[]>;
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

  async findDepartmentConstraints(academicYearId?: number) {
    return prisma.departmentConstraint.findMany({
      where: academicYearId ? { academicYearId } : undefined,
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

  // ─── Departments (transactional, year-scoped) ──────────────

  async findAllDepartmentsWithConstraints(academicYearId?: number) {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        departmentConstraints: academicYearId
          ? { where: { academicYearId } }
          : true,
      },
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
          academicYearId: data.academicYearId,
          hasMorningShift: hasMorning,
          hasEveningShift: hasEvening,
          morningCapacity: hasMorning ? data.morningCapacity : 0,
          eveningCapacity: hasEvening ? (data.eveningCapacity ?? 0) : 0,
          electiveCapacity: data.electiveCapacity ?? 0,
        },
      });

      return tx.department.findUniqueOrThrow({
        where: { id: department.id },
        include: { departmentConstraints: { where: { academicYearId: data.academicYearId } } },
      });
    });
  }

  async updateDepartmentWithConstraint(id: number, data: UpdateDepartmentDto) {
    const academicYearId = data.academicYearId;
    return prisma.$transaction(async (tx) => {
      // Update department name if provided
      if (data.name !== undefined) {
        await tx.department.update({
          where: { id },
          data: { name: data.name },
        });
      }

      if (!academicYearId) {
        return tx.department.findUniqueOrThrow({
          where: { id },
          include: { departmentConstraints: true },
        });
      }

      const hasMorning = data.hasMorningShift;
      const hasEvening = data.hasEveningShift;

      const constraintData: Record<string, unknown> = {};
      if (hasMorning !== undefined) constraintData['hasMorningShift'] = hasMorning;
      if (hasEvening !== undefined) constraintData['hasEveningShift'] = hasEvening;
      if (data.morningCapacity !== undefined) constraintData['morningCapacity'] = data.morningCapacity;
      if (data.eveningCapacity !== undefined) constraintData['eveningCapacity'] = data.eveningCapacity;
      if (data.electiveCapacity !== undefined) constraintData['electiveCapacity'] = data.electiveCapacity;

      // Force capacity to 0 when the shift is disabled
      if (hasMorning === false) constraintData['morningCapacity'] = 0;
      if (hasEvening === false) constraintData['eveningCapacity'] = 0;

      if (Object.keys(constraintData).length > 0) {
        const existing = await tx.departmentConstraint.findUnique({
          where: { departmentId_academicYearId: { departmentId: id, academicYearId } },
        });
        if (existing) {
          await tx.departmentConstraint.update({ where: { id: existing.id }, data: constraintData });
        } else {
          // Create new year-scoped constraint
          await tx.departmentConstraint.create({
            data: {
              departmentId: id,
              academicYearId,
              hasMorningShift: hasMorning ?? true,
              hasEveningShift: hasEvening ?? false,
              morningCapacity: (hasMorning !== false) ? (data.morningCapacity ?? 1) : 0,
              eveningCapacity: (hasEvening === true) ? (data.eveningCapacity ?? 0) : 0,
              electiveCapacity: data.electiveCapacity ?? 0,
            },
          });
        }
      }

      // Also sync the Department model's shift flags for backward compat
      const constraint = await tx.departmentConstraint.findUnique({
        where: { departmentId_academicYearId: { departmentId: id, academicYearId } },
      });
      if (constraint) {
        await tx.department.update({
          where: { id },
          data: {
            hasMorningShift: constraint.hasMorningShift,
            hasEveningShift: constraint.hasEveningShift,
          },
        });
      }

      return tx.department.findUniqueOrThrow({
        where: { id },
        include: { departmentConstraints: { where: { academicYearId } } },
      });
    });
  }

  // ─── Universities (transactional) ──────────────────────────

  async findAllUniversitiesWithSemesters(year?: number) {
    return prisma.university.findMany({
      orderBy: { priority: 'asc' },
      include: {
        semesters: year
          ? { where: { year }, orderBy: { year: 'desc' } }
          : { orderBy: { year: 'desc' } },
      },
    });
  }

  async createUniversityWithSemester(data: CreateUniversityWithSemesterDto & { year: number }) {
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
          priority: data.priority ?? 0,
          isActive: true,
        },
      });

      return tx.university.findUniqueOrThrow({
        where: { id: university.id },
        include: { semesters: { where: { year: data.year }, orderBy: { year: 'desc' } } },
      });
    });
  }

  async updateUniversityWithSemester(id: number, data: UpdateUniversityWithSemesterDto & { year?: number }) {
    return prisma.$transaction(async (tx) => {
      // Update university name if provided (priority is now per-semester)
      if (data.name !== undefined) {
        await tx.university.update({ where: { id }, data: { name: data.name } });
      }

      if (data.semesterStart !== undefined || data.semesterEnd !== undefined || data.year !== undefined || data.priority !== undefined) {
        const year = data.year;
        if (year) {
          // Upsert the semester for this university + year
          const existing = await tx.universitySemester.findUnique({
            where: { universityId_year: { universityId: id, year } },
          });

          if (existing) {
            await tx.universitySemester.update({
              where: { id: existing.id },
              data: {
                ...(data.semesterStart && { semesterStart: data.semesterStart }),
                ...(data.semesterEnd && { semesterEnd: data.semesterEnd }),
                ...(data.priority !== undefined && { priority: data.priority }),
              },
            });
          } else if (data.semesterStart && data.semesterEnd) {
            await tx.universitySemester.create({
              data: {
                universityId: id,
                semesterStart: data.semesterStart,
                semesterEnd: data.semesterEnd,
                year,
                priority: data.priority ?? 0,
              },
            });
          }
        }
      }

      // Sync priority to university model for backward compat
      if (data.priority !== undefined) {
        await tx.university.update({ where: { id }, data: { priority: data.priority } });
      }

      const filterYear = data.year;
      return tx.university.findUniqueOrThrow({
        where: { id },
        include: {
          semesters: filterYear
            ? { where: { year: filterYear }, orderBy: { year: 'desc' } }
            : { orderBy: { year: 'desc' } },
        },
      });
    });
  }

  // ─── Archive / Unarchive (year-scoped) ─────────────────────

  async setDepartmentActive(id: number, academicYearId: number, isActive: boolean) {
    const constraint = await prisma.departmentConstraint.findUnique({
      where: { departmentId_academicYearId: { departmentId: id, academicYearId } },
    });
    if (!constraint) throw new AppError('Department constraint not found for this year', 404);
    return prisma.departmentConstraint.update({
      where: { id: constraint.id },
      data: { isActive },
    });
  }

  async setUniversityActive(id: number, year: number, isActive: boolean) {
    const semester = await prisma.universitySemester.findUnique({
      where: { universityId_year: { universityId: id, year } },
    });
    if (!semester) throw new AppError('University semester not found for this year', 404);
    return prisma.universitySemester.update({
      where: { id: semester.id },
      data: { isActive },
    });
  }

  // ─── Delete Department (transactional) ─────────────────────

  async deleteDepartment(id: number) {
    return prisma.$transaction(async (tx) => {
      const department = await tx.department.findUnique({ where: { id } });
      if (!department) throw new AppError('Department not found', 404);

      const assignmentCount = await tx.assignment.count({ where: { departmentId: id } });
      if (assignmentCount > 0) throw new AppError('Cannot delete department with existing assignments', 409);

      await tx.departmentConstraint.deleteMany({ where: { departmentId: id } });
      await tx.softConstraint.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
      await tx.department.delete({ where: { id } });
    });
  }

  // ─── Delete University (transactional) ─────────────────────

  async deleteUniversity(id: number) {
    return prisma.$transaction(async (tx) => {
      const university = await tx.university.findUnique({ where: { id } });
      if (!university) throw new AppError('University not found', 404);

      const studentCount = await tx.student.count({ where: { universityId: id } });
      if (studentCount > 0) throw new AppError('Cannot delete university with existing students', 409);

      const assignmentCount = await tx.assignment.count({ where: { universityId: id } });
      if (assignmentCount > 0) throw new AppError('Cannot delete university with existing assignments', 409);

      await tx.universitySemester.deleteMany({ where: { universityId: id } });
      await tx.softConstraint.updateMany({ where: { universityId: id }, data: { universityId: null } });
      await tx.university.delete({ where: { id } });
    });
  }

  // ─── Copy Year Constraints ────────────────────────────────

  async copyConstraintsFromYear(sourceAcademicYearId: number, targetAcademicYearId: number) {
    return prisma.$transaction(async (tx) => {
      // Copy department constraints
      const sourceDeptConstraints = await tx.departmentConstraint.findMany({
        where: { academicYearId: sourceAcademicYearId },
      });

      for (const dc of sourceDeptConstraints) {
        const existing = await tx.departmentConstraint.findUnique({
          where: { departmentId_academicYearId: { departmentId: dc.departmentId, academicYearId: targetAcademicYearId } },
        });
        if (!existing) {
          await tx.departmentConstraint.create({
            data: {
              departmentId: dc.departmentId,
              academicYearId: targetAcademicYearId,
              hasMorningShift: dc.hasMorningShift,
              hasEveningShift: dc.hasEveningShift,
              morningCapacity: dc.morningCapacity,
              eveningCapacity: dc.eveningCapacity,
              electiveCapacity: dc.electiveCapacity,
              isActive: dc.isActive,
            },
          });
        }
      }

      // Copy university semesters: adjust dates by +1 year
      const sourceYear = await tx.academicYear.findUnique({ where: { id: sourceAcademicYearId } });
      const targetYear = await tx.academicYear.findUnique({ where: { id: targetAcademicYearId } });
      if (!sourceYear || !targetYear) throw new AppError('Academic year not found', 404);

      const sourceCalendarYear = new Date(sourceYear.startDate).getUTCFullYear();
      const targetCalendarYear = new Date(targetYear.startDate).getUTCFullYear();

      const sourceSemesters = await tx.universitySemester.findMany({
        where: { year: sourceCalendarYear },
      });

      for (const sem of sourceSemesters) {
        const targetSemYear = targetCalendarYear;
        const existing = await tx.universitySemester.findUnique({
          where: { universityId_year: { universityId: sem.universityId, year: targetSemYear } },
        });
        if (!existing) {
          const yearDiff = targetCalendarYear - sourceCalendarYear;
          const newStart = new Date(sem.semesterStart);
          newStart.setUTCFullYear(newStart.getUTCFullYear() + yearDiff);
          const newEnd = new Date(sem.semesterEnd);
          newEnd.setUTCFullYear(newEnd.getUTCFullYear() + yearDiff);

          await tx.universitySemester.create({
            data: {
              universityId: sem.universityId,
              semesterStart: newStart,
              semesterEnd: newEnd,
              year: targetSemYear,
              priority: sem.priority,
              isActive: sem.isActive,
            },
          });
        }
      }
    });
  }
}
