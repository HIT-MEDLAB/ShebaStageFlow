import prisma from '../../../lib/prisma';
import { ConstraintValidationError, type ConstraintViolation } from '../../../shared/errors/ConstraintValidationError';

export interface ValidationContext {
  departmentId: number;
  universityId: number;
  startDate: Date;
  endDate: Date;
  type: 'GROUP' | 'ELECTIVE';
  shiftType: 'MORNING' | 'EVENING';
  studentCount?: number | null;
  yearInProgram?: number | null;
  excludeAssignmentIds?: number[];
}

type RuleFunction = (ctx: ValidationContext) => Promise<ConstraintViolation[]>;

const ruleRegistry = new Map<string, RuleFunction>();

// ─── SEMESTER_BOUNDARY ──────────────────────────────────────────
ruleRegistry.set('SEMESTER_BOUNDARY', async (ctx) => {
  const semester = await prisma.universitySemester.findFirst({
    where: { universityId: ctx.universityId },
    orderBy: { year: 'desc' },
  });

  if (!semester) {
    return [{
      code: 'SEMESTER_BOUNDARY',
      type: 'warning',
      messageKey: 'grid.warning.noSemesterDefined',
    }];
  }

  const start = new Date(ctx.startDate);
  const end = new Date(ctx.endDate);
  const semStart = new Date(semester.semesterStart);
  const semEnd = new Date(semester.semesterEnd);

  if (start < semStart || end > semEnd) {
    return [{
      code: 'SEMESTER_BOUNDARY',
      type: 'error',
      messageKey: 'grid.blocked.semesterBoundary',
    }];
  }
  return [];
});

// ─── ONE_GROUP_PER_SHIFT ────────────────────────────────────────
ruleRegistry.set('ONE_GROUP_PER_SHIFT', async (ctx) => {
  if (ctx.type !== 'GROUP') return [];

  const overlapping = await prisma.assignment.findFirst({
    where: {
      departmentId: ctx.departmentId,
      type: 'GROUP',
      shiftType: ctx.shiftType,
      status: { in: ['APPROVED', 'PENDING'] },
      startDate: { lte: ctx.endDate },
      endDate: { gte: ctx.startDate },
      ...(ctx.excludeAssignmentIds?.length ? { id: { notIn: ctx.excludeAssignmentIds } } : {}),
    },
  });

  if (overlapping) {
    return [{
      code: 'ONE_GROUP_PER_SHIFT',
      type: 'error',
      messageKey: 'grid.blocked.oneGroupPerShift',
    }];
  }
  return [];
});

// ─── CAPACITY_LIMIT ─────────────────────────────────────────────
ruleRegistry.set('CAPACITY_LIMIT', async (ctx) => {
  const deptConstraint = await prisma.departmentConstraint.findFirst({
    where: { departmentId: ctx.departmentId },
  });

  if (!deptConstraint) {
    return [{
      code: 'CAPACITY_LIMIT',
      type: 'warning',
      messageKey: 'grid.warning.noCapacityDefined',
    }];
  }

  if (ctx.type === 'GROUP') {
    const capacity = ctx.shiftType === 'MORNING'
      ? deptConstraint.morningCapacity
      : deptConstraint.eveningCapacity;

    if (ctx.studentCount && ctx.studentCount > capacity) {
      return [{
        code: 'CAPACITY_LIMIT',
        type: 'error',
        messageKey: 'grid.blocked.capacityFull',
        params: { capacity, studentCount: ctx.studentCount },
      }];
    }
  } else {
    // ELECTIVE — count existing electives in same slot
    const existingElectives = await prisma.assignment.count({
      where: {
        departmentId: ctx.departmentId,
        type: 'ELECTIVE',
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: { lte: ctx.endDate },
        endDate: { gte: ctx.startDate },
        ...(ctx.excludeAssignmentIds?.length ? { id: { notIn: ctx.excludeAssignmentIds } } : {}),
      },
    });

    if (existingElectives >= deptConstraint.electiveCapacity) {
      return [{
        code: 'CAPACITY_LIMIT',
        type: 'error',
        messageKey: 'grid.blocked.electiveCapacityFull',
        params: { capacity: deptConstraint.electiveCapacity },
      }];
    }
  }

  return [];
});

// ─── FIRST_CLINICAL_ROTATION ────────────────────────────────────
ruleRegistry.set('FIRST_CLINICAL_ROTATION', async (ctx) => {
  if (ctx.yearInProgram !== 1) return [];

  const dept = await prisma.department.findUnique({
    where: { id: ctx.departmentId },
    select: { name: true },
  });

  if (!dept) return [];

  const allowedDepts = ['רפואה פנימית', 'ילדים'];
  if (!allowedDepts.includes(dept.name)) {
    return [{
      code: 'FIRST_CLINICAL_ROTATION',
      type: 'warning',
      messageKey: 'grid.warning.firstClinicalRotation',
      params: { departmentName: dept.name },
    }];
  }

  return [];
});

// ─── STUDENT_DOUBLE_BOOKING ─────────────────────────────────────
export async function validateStudentLink(
  studentId: number,
  assignmentId: number,
  startDate: Date,
  endDate: Date,
  shiftType: 'MORNING' | 'EVENING',
): Promise<ConstraintViolation[]> {
  const isActive = await prisma.ironConstraint.findFirst({
    where: { name: 'STUDENT_DOUBLE_BOOKING', isActive: true },
  });

  if (!isActive) return [];

  const overlapping = await prisma.assignment.findFirst({
    where: {
      id: { not: assignmentId },
      students: { some: { studentId } },
      shiftType,
      status: { in: ['APPROVED', 'PENDING'] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: {
      department: { select: { name: true } },
    },
  });

  if (overlapping) {
    return [{
      code: 'STUDENT_DOUBLE_BOOKING',
      type: 'error',
      messageKey: 'grid.blocked.studentDoubleBooking',
      params: { departmentName: overlapping.department.name },
    }];
  }

  return [];
}

// ─── Engine ─────────────────────────────────────────────────────
export class ConstraintEngine {
  async validate(ctx: ValidationContext, forceOverride = false): Promise<ConstraintViolation[]> {
    const activeConstraints = await prisma.ironConstraint.findMany({
      where: { isActive: true },
    });

    const allViolations: ConstraintViolation[] = [];

    for (const ic of activeConstraints) {
      const ruleFn = ruleRegistry.get(ic.name);
      if (ruleFn) {
        const violations = await ruleFn(ctx);
        allViolations.push(...violations);
      }
    }

    const errors = allViolations.filter((v) => v.type === 'error');
    const warnings = allViolations.filter((v) => v.type === 'warning');

    if (errors.length > 0 && !forceOverride) {
      throw new ConstraintValidationError(errors, warnings);
    }

    // When forceOverride is true, return all violations as warnings
    return forceOverride ? allViolations : warnings;
  }
}
