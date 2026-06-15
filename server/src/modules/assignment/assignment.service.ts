import { AppError } from '../../shared/errors/AppError';
import { AssignmentRepository } from './assignment.repository';
import type { IAssignmentRepository, AssignmentFilters, PendingMoveData } from './assignment.repository';
import type {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  MoveAssignmentDto,
  ImportAssignmentsDto,
  AddStudentDto,
  ImportStudentsDto,
  DisplaceAssignmentDto,
  SmartImportValidateDto,
  SmartImportExecuteDto,
  ValidateDisplacementWeekDto,
  CreateBlockDto,
  MoveBlockDto,
  FindBlockPositionsDto,
  ConvertToBlockDto,
} from './assignment.schema';
import { ConstraintEngine, validateStudentLink } from './validation/constraintEngine';
import { ConstraintValidationError, type ConstraintViolation } from '../../shared/errors/ConstraintValidationError';
import { ImportValidationService } from './import/importService';
import { validateWeekForDisplacement, findAvailableBlockPositions } from './import/suggestionEngine';
import type { ImportValidationResult } from './import/importTypes';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ACADEMIC_COORDINATOR';

export class AssignmentService {
  private readonly engine = new ConstraintEngine();

  constructor(private readonly repository: IAssignmentRepository) {}

  private isAdmin(role: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  private determineStatus(role: string): 'APPROVED' | 'PENDING' {
    return this.isAdmin(role) ? 'APPROVED' : 'APPROVED'; // academics with no conflict also auto-approve
  }

  async getByAcademicYear(academicYearId: number, filters?: AssignmentFilters) {
    return this.repository.findByAcademicYear(academicYearId, filters);
  }

  async getForExport(academicYearId: number, filters?: AssignmentFilters) {
    return (this.repository as AssignmentRepository).findForExport(academicYearId, filters);
  }

  async getById(id: number) {
    const assignment = await this.repository.findById(id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    return assignment;
  }

  async create(dto: CreateAssignmentDto, userId: number, userRole: string, forceOverride?: boolean) {
    const canForce = this.isAdmin(userRole) && forceOverride;
    const warnings = await this.engine.validate({
      departmentId: dto.departmentId,
      universityId: dto.universityId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      type: dto.type,
      shiftType: dto.shiftType,
      studentCount: dto.studentCount,
      yearInProgram: dto.yearInProgram,
      academicYearId: dto.academicYearId,
    }, canForce);

    const status = this.determineStatus(userRole);
    const approvedById = this.isAdmin(userRole) ? userId : undefined;
    const result = await this.repository.create(dto, userId, status, approvedById);
    return { ...result, warnings };
  }

  async update(id: number, dto: UpdateAssignmentDto, userId: number, userRole: string, forceOverride?: boolean) {
    const existing = await this.getById(id) as {
      departmentId: number; universityId: number; startDate: Date; endDate: Date;
      type: 'GROUP' | 'ELECTIVE'; shiftType: 'MORNING' | 'EVENING';
      studentCount: number | null; yearInProgram: number | null; academicYearId: number | null;
    };

    const canForce = this.isAdmin(userRole) && forceOverride;
    const warnings = await this.engine.validate({
      departmentId: dto.departmentId ?? existing.departmentId,
      universityId: dto.universityId ?? existing.universityId,
      startDate: dto.startDate ?? existing.startDate,
      endDate: dto.endDate ?? existing.endDate,
      type: dto.type ?? existing.type,
      shiftType: dto.shiftType ?? existing.shiftType,
      studentCount: dto.studentCount !== undefined ? dto.studentCount : existing.studentCount,
      yearInProgram: dto.yearInProgram ?? existing.yearInProgram,
      excludeAssignmentIds: [id],
      academicYearId: existing.academicYearId,
    }, canForce);

    const result = await this.repository.update(id, dto);
    return { ...result, warnings };
  }

  async move(id: number, dto: MoveAssignmentDto, userId: number, userRole: string, forceOverride?: boolean) {
    const existing = await this.getById(id) as { universityId: number; type: 'GROUP' | 'ELECTIVE'; shiftType: 'MORNING' | 'EVENING'; studentCount?: number | null; yearInProgram?: number | null; academicYearId?: number | null };
    const canForce = this.isAdmin(userRole) && forceOverride;
    await this.engine.validate({
      departmentId: dto.departmentId,
      universityId: existing.universityId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      type: existing.type,
      shiftType: existing.shiftType,
      studentCount: existing.studentCount,
      yearInProgram: existing.yearInProgram,
      excludeAssignmentIds: [id],
      academicYearId: existing.academicYearId,
    }, canForce);

    const status = this.isAdmin(userRole) ? 'APPROVED' as const : undefined;
    const approvedById = this.isAdmin(userRole) ? userId : undefined;
    return this.repository.move(id, dto.departmentId, dto.startDate, dto.endDate, status, approvedById);
  }

  async removeAll() {
    return this.repository.removeAll();
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repository.remove(id);
  }

  async importAssignments(dto: ImportAssignmentsDto, userId: number) {
    return this.repository.bulkCreate(dto.assignments, userId);
  }

  async addStudent(assignmentId: number, dto: AddStudentDto, userRole: string, forceOverride?: boolean) {
    const assignment = await this.getById(assignmentId) as {
      startDate: Date; endDate: Date; shiftType: 'MORNING' | 'EVENING';
      studentCount: number | null; students: unknown[];
    };

    // Check capacity
    if (assignment.studentCount != null) {
      const currentCount = assignment.students.length;
      if (currentCount + 1 > assignment.studentCount) {
        if (!this.isAdmin(userRole)) {
          throw new AppError('Student capacity exceeded', 400);
        }
        if (!forceOverride) {
          throw new AppError('Student capacity exceeded — admin override required', 409);
        }
      }
    }

    // Check for double-booking if the student already exists
    const existingStudent = await this.repository.findStudentByNationalId?.(dto.nationalId);
    if (existingStudent) {
      const violations = await validateStudentLink(
        existingStudent.id, assignmentId, assignment.startDate, assignment.endDate, assignment.shiftType,
      );
      if (violations.length > 0) {
        throw new ConstraintValidationError(violations);
      }
    }

    const { forceOverride: _, ...studentData } = dto;
    return this.repository.addStudent(assignmentId, studentData);
  }

  async removeStudent(assignmentId: number, studentId: number) {
    await this.getById(assignmentId);
    return this.repository.removeStudent(assignmentId, studentId);
  }

  async importStudents(assignmentId: number, dto: ImportStudentsDto, userRole: string, forceOverride?: boolean) {
    const assignment = await this.getById(assignmentId) as {
      startDate: Date; endDate: Date; shiftType: 'MORNING' | 'EVENING';
      studentCount: number | null; students: unknown[];
    };

    // Check capacity
    if (assignment.studentCount != null) {
      const currentCount = assignment.students.length;
      if (currentCount + dto.students.length > assignment.studentCount) {
        if (!this.isAdmin(userRole)) {
          throw new AppError('Student capacity exceeded', 400);
        }
        if (!forceOverride) {
          throw new AppError('Student capacity exceeded — admin override required', 409);
        }
      }
    }

    // Validate all students for double-booking before adding any
    const allViolations: ConstraintViolation[] = [];
    for (const studentData of dto.students) {
      const existing = await this.repository.findStudentByNationalId?.(studentData.nationalId);
      if (existing) {
        const violations = await validateStudentLink(
          existing.id, assignmentId, assignment.startDate, assignment.endDate, assignment.shiftType,
        );
        allViolations.push(
          ...violations.map(v => ({
            ...v,
            params: { ...v.params, studentName: `${studentData.firstName} ${studentData.lastName}` },
          })),
        );
      }
    }

    if (allViolations.length > 0) {
      throw new ConstraintValidationError(allViolations);
    }

    return this.repository.bulkAddStudents(assignmentId, dto.students);
  }

  async approve(id: number, approvedById: number) {
    const assignment = await this.getById(id) as { status: string };
    if (assignment.status !== 'PENDING') {
      throw new AppError('Only pending assignments can be approved', 400);
    }
    return this.repository.approve(id, approvedById);
  }

  async reject(id: number, rejectionReason?: string) {
    const assignment = await this.getById(id) as { status: string; pendingMoveData?: unknown };
    if (assignment.status !== 'PENDING') {
      throw new AppError('Only pending assignments can be rejected', 400);
    }

    if (assignment.pendingMoveData) {
      await this.repository.rejectAndRevert(id, assignment.pendingMoveData as PendingMoveData);
      return;
    }

    // Simple delete for assignments without displacement data
    await this.repository.remove(id);
  }

  async validateDisplacementWeek(dto: ValidateDisplacementWeekDto) {
    return validateWeekForDisplacement(
      dto.departmentId,
      dto.shiftType,
      dto.type,
      dto.universityId,
      dto.startDate,
      dto.endDate,
      dto.studentCount ?? null,
      dto.yearInProgram,
      dto.excludeAssignmentIds,
    );
  }

  async validateSmartImport(dto: SmartImportValidateDto): Promise<ImportValidationResult> {
    const importService = new ImportValidationService();
    return importService.validate(dto.rows, dto.academicYearId);
  }

  async executeSmartImport(
    dto: SmartImportExecuteDto,
    userId: number,
    userRole: string,
  ): Promise<{ created: number; displaced: number }> {
    const isAdminRole = this.isAdmin(userRole);
    // Validate force_create permission upfront
    const hasForceCreate = dto.actions.some((a) => a.type === 'force_create');
    if (hasForceCreate && !isAdminRole) {
      throw new AppError('Only admins can use force_create', 403);
    }

    let created = 0;
    let displaced = 0;

    // Pre-compute block groupings: actions sharing a blockKey form a group block
    const blockGroups = new Map<string, number[]>();
    for (let i = 0; i < dto.actions.length; i++) {
      const action = dto.actions[i];
      if (action.blockKey) {
        if (!blockGroups.has(action.blockKey)) {
          blockGroups.set(action.blockKey, []);
        }
        blockGroups.get(action.blockKey)!.push(i);
      }
    }

    // Build lookup: actionIndex -> { groupId, groupIndex } for blocks with 2+ members
    const blockLookup = new Map<number, { groupId: string; groupIndex: number }>();
    for (const [, indices] of blockGroups) {
      if (indices.length < 2) continue;
      const groupId = crypto.randomUUID();
      // Sort by startDate to determine groupIndex order
      const sorted = [...indices].sort((a, b) =>
        new Date(dto.actions[a].dto.startDate).getTime() - new Date(dto.actions[b].dto.startDate).getTime(),
      );
      sorted.forEach((actionIdx, groupIndex) => {
        blockLookup.set(actionIdx, { groupId, groupIndex });
      });
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < dto.actions.length; i++) {
        const action = dto.actions[i];
        const actionDto = action.dto;
        const blockInfo = blockLookup.get(i);

        if (action.type === 'create') {
          // Re-validate within transaction
          await this.engine.validate({
            departmentId: actionDto.departmentId,
            universityId: actionDto.universityId,
            startDate: actionDto.startDate,
            endDate: actionDto.endDate,
            type: actionDto.type,
            shiftType: actionDto.shiftType,
            studentCount: actionDto.studentCount,
            yearInProgram: actionDto.yearInProgram,
            academicYearId: dto.academicYearId,
          });

          await tx.assignment.create({
            data: {
              departmentId: actionDto.departmentId,
              universityId: actionDto.universityId,
              academicYearId: dto.academicYearId,
              startDate: actionDto.startDate,
              endDate: actionDto.endDate,
              type: actionDto.type,
              shiftType: actionDto.shiftType,
              studentCount: actionDto.studentCount ?? null,
              yearInProgram: actionDto.yearInProgram,
              tutorName: actionDto.tutorName ?? null,
              createdById: userId,
              status: 'APPROVED',
              ...(isAdminRole ? { approvedById: userId } : {}),
              ...(blockInfo ? { groupId: blockInfo.groupId, groupIndex: blockInfo.groupIndex } : {}),
            },
          });
          created++;
        } else if (action.type === 'displace') {
          // Re-validate the displaced assignment's new location
          const displacedRecord = await tx.assignment.findUnique({
            where: { id: action.displacedAssignmentId },
            select: { universityId: true, type: true, shiftType: true, studentCount: true, yearInProgram: true },
          });
          if (displacedRecord) {
            await this.engine.validate({
              departmentId: action.displacedDepartmentId,
              universityId: displacedRecord.universityId,
              startDate: action.displacedStartDate,
              endDate: action.displacedEndDate,
              type: displacedRecord.type,
              shiftType: displacedRecord.shiftType,
              studentCount: displacedRecord.studentCount,
              yearInProgram: displacedRecord.yearInProgram,
              excludeAssignmentIds: [action.displacedAssignmentId],
              academicYearId: dto.academicYearId,
            });
          }

          // Move displaced assignment to new location
          await tx.assignment.update({
            where: { id: action.displacedAssignmentId },
            data: {
              departmentId: action.displacedDepartmentId,
              startDate: action.displacedStartDate,
              endDate: action.displacedEndDate,
              status: 'APPROVED',
            },
          });

          // Create the new incoming assignment
          await tx.assignment.create({
            data: {
              departmentId: actionDto.departmentId,
              universityId: actionDto.universityId,
              academicYearId: dto.academicYearId,
              startDate: actionDto.startDate,
              endDate: actionDto.endDate,
              type: actionDto.type,
              shiftType: actionDto.shiftType,
              studentCount: actionDto.studentCount ?? null,
              yearInProgram: actionDto.yearInProgram,
              tutorName: actionDto.tutorName ?? null,
              createdById: userId,
              status: 'APPROVED',
              ...(isAdminRole ? { approvedById: userId } : {}),
              ...(blockInfo ? { groupId: blockInfo.groupId, groupIndex: blockInfo.groupIndex } : {}),
            },
          });
          created++;
          displaced++;
        } else if (action.type === 'force_create') {
          await tx.assignment.create({
            data: {
              departmentId: actionDto.departmentId,
              universityId: actionDto.universityId,
              academicYearId: dto.academicYearId,
              startDate: actionDto.startDate,
              endDate: actionDto.endDate,
              type: actionDto.type,
              shiftType: actionDto.shiftType,
              studentCount: actionDto.studentCount ?? null,
              yearInProgram: actionDto.yearInProgram,
              tutorName: actionDto.tutorName ?? null,
              createdById: userId,
              status: 'APPROVED',
              approvedById: userId,
              ...(blockInfo ? { groupId: blockInfo.groupId, groupIndex: blockInfo.groupIndex } : {}),
            },
          });
          created++;
        }
      }
    });

    return { created, displaced };
  }

  // ── Block (multi-week) operations ─────────────────────────────

  private computeBlockWeeks(startDate: Date, weekCount: number): Array<{ startDate: Date; endDate: Date }> {
    const weeks: Array<{ startDate: Date; endDate: Date }> = [];
    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(startDate);
      weekStart.setUTCDate(weekStart.getUTCDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 4);
      weeks.push({ startDate: weekStart, endDate: weekEnd });
    }
    return weeks;
  }

  async createBlock(dto: CreateBlockDto, userId: number, userRole: string, forceOverride?: boolean) {
    const canForce = this.isAdmin(userRole) && forceOverride;
    const weekCount = dto.shifts.length;
    if (weekCount < 2) {
      throw new AppError('Block must have at least 2 weeks', 400);
    }
    const weeks = this.computeBlockWeeks(dto.startDate, weekCount);

    // Validate each week against ALL constraints (holidays, date blocks, dept blocks, engine rules)
    const allWarnings: Array<{ weekIndex: number; warnings: unknown[] }> = [];
    for (let i = 0; i < weeks.length; i++) {
      const fullCheck = await validateWeekForDisplacement(
        dto.departmentId,
        dto.shifts[i],
        dto.type,
        dto.universityId,
        weeks[i].startDate,
        weeks[i].endDate,
        dto.studentCount ?? null,
        dto.yearInProgram,
        [],
      );
      if (!fullCheck.valid && !canForce) {
        throw new AppError(
          fullCheck.failureReason ?? 'Constraint violation on week ' + (i + 1),
          422,
        );
      }

      const warnings = await this.engine.validate({
        departmentId: dto.departmentId,
        universityId: dto.universityId,
        startDate: weeks[i].startDate,
        endDate: weeks[i].endDate,
        type: dto.type,
        shiftType: dto.shifts[i],
        studentCount: dto.studentCount,
        yearInProgram: dto.yearInProgram,
        academicYearId: dto.academicYearId,
      }, true); // pass true to collect warnings without throwing
      if (warnings.length > 0) {
        allWarnings.push({ weekIndex: i, warnings });
      }
    }

    const groupId = crypto.randomUUID();
    const status = this.determineStatus(userRole);
    const approvedById = this.isAdmin(userRole) ? userId : undefined;

    const assignments = await prisma.$transaction(async (tx) => {
      const results = [];
      for (let i = 0; i < weeks.length; i++) {
        const assignment = await tx.assignment.create({
          data: {
            departmentId: dto.departmentId,
            universityId: dto.universityId,
            academicYearId: dto.academicYearId,
            startDate: weeks[i].startDate,
            endDate: weeks[i].endDate,
            type: dto.type,
            shiftType: dto.shifts[i],
            studentCount: dto.studentCount ?? null,
            yearInProgram: dto.yearInProgram,
            tutorName: dto.tutorName ?? null,
            createdById: userId,
            status,
            ...(approvedById ? { approvedById } : {}),
            groupId,
            groupIndex: i,
          },
          include: {
            university: { select: { name: true } },
            department: { select: { name: true } },
          },
        });
        results.push(assignment);
      }
      return results;
    });

    return { assignments, warnings: allWarnings };
  }

  async convertToBlock(id: number, dto: ConvertToBlockDto, userId: number, userRole: string, forceOverride?: boolean) {
    const existing = await this.getById(id) as {
      id: number; academicYearId: number; groupId: string | null; groupIndex: number | null;
    };

    const canForce = this.isAdmin(userRole) && forceOverride;
    const weekCount = dto.shifts.length;
    if (weekCount < 2) {
      throw new AppError('Block must have at least 2 weeks', 400);
    }

    const weeks = this.computeBlockWeeks(dto.startDate, weekCount);

    // Validate each week
    const allWarnings: Array<{ weekIndex: number; warnings: unknown[] }> = [];
    for (let i = 0; i < weeks.length; i++) {
      const fullCheck = await validateWeekForDisplacement(
        dto.departmentId,
        dto.shifts[i],
        dto.type,
        dto.universityId,
        weeks[i].startDate,
        weeks[i].endDate,
        dto.studentCount ?? null,
        dto.yearInProgram,
        [id],
      );
      if (!fullCheck.valid && !canForce) {
        throw new AppError(
          fullCheck.failureReason ?? 'Constraint violation on week ' + (i + 1),
          422,
        );
      }

      const warnings = await this.engine.validate({
        departmentId: dto.departmentId,
        universityId: dto.universityId,
        startDate: weeks[i].startDate,
        endDate: weeks[i].endDate,
        type: dto.type,
        shiftType: dto.shifts[i],
        studentCount: dto.studentCount,
        yearInProgram: dto.yearInProgram,
        excludeAssignmentIds: [id],
        academicYearId: existing.academicYearId,
      }, true);
      if (warnings.length > 0) {
        allWarnings.push({ weekIndex: i, warnings });
      }
    }

    const newGroupId = crypto.randomUUID();
    const status = this.determineStatus(userRole);
    const approvedById = this.isAdmin(userRole) ? userId : undefined;

    const assignments = await prisma.$transaction(async (tx) => {
      // 1. Collect student IDs before deleting the old assignment
      const studentLinks = await tx.assignmentStudent.findMany({
        where: { assignmentId: id },
        select: { studentId: true },
      });
      const studentIds = studentLinks.map((l) => l.studentId);

      // 2. If old assignment was part of a block, clean up the old block
      if (existing.groupId) {
        const siblings = await tx.assignment.findMany({
          where: { groupId: existing.groupId },
          orderBy: { groupIndex: 'asc' },
        });
        const remaining = siblings.filter((s) => s.id !== id);

        if (remaining.length <= 1) {
          // Dissolve the old block
          for (const s of remaining) {
            await tx.assignment.update({
              where: { id: s.id },
              data: { groupId: null, groupIndex: null },
            });
          }
        } else {
          // Re-index remaining siblings
          for (let i = 0; i < remaining.length; i++) {
            await tx.assignment.update({
              where: { id: remaining[i].id },
              data: { groupIndex: i },
            });
          }
        }
      }

      // 3. Delete the old assignment (cascades AssignmentStudent links)
      await tx.assignment.delete({ where: { id } });

      // 4. Create the new block assignments
      const results = [];
      for (let i = 0; i < weeks.length; i++) {
        const assignment = await tx.assignment.create({
          data: {
            departmentId: dto.departmentId,
            universityId: dto.universityId,
            academicYearId: existing.academicYearId,
            startDate: weeks[i].startDate,
            endDate: weeks[i].endDate,
            type: dto.type,
            shiftType: dto.shifts[i],
            studentCount: dto.studentCount ?? null,
            yearInProgram: dto.yearInProgram,
            tutorName: dto.tutorName ?? null,
            createdById: userId,
            status,
            ...(approvedById ? { approvedById } : {}),
            groupId: newGroupId,
            groupIndex: i,
          },
          include: {
            university: { select: { name: true } },
            department: { select: { name: true } },
          },
        });
        results.push(assignment);
      }

      // 5. Re-create student links on all assignments of the new block
      if (studentIds.length > 0 && results.length > 0) {
        for (const result of results) {
          for (const studentId of studentIds) {
            await tx.assignmentStudent.create({
              data: {
                assignmentId: result.id,
                studentId,
              },
            });
          }
        }
      }

      return results;
    });

    return { assignments, warnings: allWarnings };
  }

  async moveBlock(groupId: string, dto: MoveBlockDto, userId: number, userRole: string, forceOverride?: boolean) {
    const blockAssignments = await prisma.assignment.findMany({
      where: { groupId },
      orderBy: { groupIndex: 'asc' },
    });

    if (blockAssignments.length === 0) {
      throw new AppError('Block not found', 404);
    }

    const canForce = this.isAdmin(userRole) && forceOverride;
    const weeks = dto.startDates
      ? dto.startDates.map((d) => {
          const start = new Date(d);
          const end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 4);
          return { startDate: start, endDate: end };
        })
      : this.computeBlockWeeks(dto.startDate!, blockAssignments.length);

    if (weeks.length !== blockAssignments.length) {
      throw new AppError('startDates length must match block size', 400);
    }
    const excludeIds = blockAssignments.map((a) => a.id);

    // Validate each week against ALL constraints (holidays, date blocks, dept blocks, engine rules)
    for (let i = 0; i < weeks.length; i++) {
      const fullCheck = await validateWeekForDisplacement(
        dto.departmentId,
        blockAssignments[i].shiftType,
        blockAssignments[0].type,
        blockAssignments[0].universityId,
        weeks[i].startDate,
        weeks[i].endDate,
        blockAssignments[0].studentCount,
        blockAssignments[0].yearInProgram ?? 1,
        excludeIds,
      );
      if (!fullCheck.valid && !canForce) {
        throw new AppError(
          fullCheck.failureReason ?? 'Constraint violation on week ' + (i + 1),
          422,
        );
      }
    }

    const status = this.isAdmin(userRole) ? 'APPROVED' as const : undefined;
    const approvedById = this.isAdmin(userRole) ? userId : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const results = [];
      for (let i = 0; i < blockAssignments.length; i++) {
        const assignment = await tx.assignment.update({
          where: { id: blockAssignments[i].id },
          data: {
            departmentId: dto.departmentId,
            startDate: weeks[i].startDate,
            endDate: weeks[i].endDate,
            ...(status ? { status, pendingMoveData: Prisma.DbNull } : {}),
            ...(approvedById ? { approvedById } : {}),
          },
          include: {
            university: { select: { name: true } },
            department: { select: { name: true } },
          },
        });
        results.push(assignment);
      }
      return results;
    });

    return updated;
  }

  async detachFromBlock(assignmentId: number) {
    const assignment = await this.getById(assignmentId) as { id: number; groupId: string | null; groupIndex: number | null };
    if (!assignment.groupId) {
      throw new AppError('Assignment is not part of a block', 400);
    }

    const groupId = assignment.groupId;
    const detachedIndex = assignment.groupIndex!;

    // Get all siblings
    const siblings = await prisma.assignment.findMany({
      where: { groupId },
      orderBy: { groupIndex: 'asc' },
    });

    await prisma.$transaction(async (tx) => {
      // Detach the target assignment
      await tx.assignment.update({
        where: { id: assignmentId },
        data: { groupId: null, groupIndex: null },
      });

      const remaining = siblings.filter((s) => s.id !== assignmentId);

      if (remaining.length <= 1) {
        // Only 0 or 1 left — dissolve the block entirely
        for (const s of remaining) {
          await tx.assignment.update({
            where: { id: s.id },
            data: { groupId: null, groupIndex: null },
          });
        }
      } else if (detachedIndex === 0 || detachedIndex === siblings.length - 1) {
        // Detached from edge — just re-index remaining
        for (let i = 0; i < remaining.length; i++) {
          await tx.assignment.update({
            where: { id: remaining[i].id },
            data: { groupIndex: i },
          });
        }
      } else {
        // Detached from middle — split into two blocks
        const beforeGroup = remaining.filter((s) => s.groupIndex! < detachedIndex);
        const afterGroup = remaining.filter((s) => s.groupIndex! > detachedIndex);

        if (beforeGroup.length <= 1) {
          // Before group becomes standalone
          for (const s of beforeGroup) {
            await tx.assignment.update({
              where: { id: s.id },
              data: { groupId: null, groupIndex: null },
            });
          }
        } else {
          // Before group keeps original groupId, re-index
          for (let i = 0; i < beforeGroup.length; i++) {
            await tx.assignment.update({
              where: { id: beforeGroup[i].id },
              data: { groupIndex: i },
            });
          }
        }

        if (afterGroup.length <= 1) {
          // After group becomes standalone
          for (const s of afterGroup) {
            await tx.assignment.update({
              where: { id: s.id },
              data: { groupId: null, groupIndex: null },
            });
          }
        } else {
          // After group gets a new groupId
          const newGroupId = crypto.randomUUID();
          for (let i = 0; i < afterGroup.length; i++) {
            await tx.assignment.update({
              where: { id: afterGroup[i].id },
              data: { groupId: newGroupId, groupIndex: i },
            });
          }
        }
      }
    });

    return { success: true };
  }

  async findBlockPositions(dto: FindBlockPositionsDto) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }

    const positions = await findAvailableBlockPositions(
      dto.departmentId,
      dto.blockSize,
      dto.shifts,
      dto.type,
      dto.universityId,
      { startDate: academicYear.startDate, endDate: academicYear.endDate },
      dto.studentCount ?? null,
      dto.yearInProgram,
      dto.excludeGroupId,
    );

    return positions.map((p) => ({
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
    }));
  }

  async displace(id: number, dto: DisplaceAssignmentDto, userId: number, userRole: string, forceOverride?: boolean) {
    await this.getById(id);

    // Get the incoming assignment's current position (for pendingMoveData)
    const incoming = await this.getById(id) as { departmentId: number; startDate: string; endDate: string; universityId: number; type: 'GROUP' | 'ELECTIVE'; shiftType: 'MORNING' | 'EVENING'; studentCount?: number | null; yearInProgram?: number | null; academicYearId?: number | null };
    // Get displaced assignment's current position
    const displaced = await this.getById(dto.displacedAssignmentId) as {
      departmentId: number; startDate: string; endDate: string;
      universityId: number; type: 'GROUP' | 'ELECTIVE'; shiftType: 'MORNING' | 'EVENING';
      studentCount?: number | null; yearInProgram?: number | null;
    };

    const isAdminRole = this.isAdmin(userRole);
    const canForce = isAdminRole && forceOverride;
    // Validate incoming assignment at its new position
    await this.engine.validate({
      departmentId: dto.departmentId,
      universityId: incoming.universityId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      type: incoming.type,
      shiftType: incoming.shiftType,
      studentCount: incoming.studentCount,
      yearInProgram: incoming.yearInProgram,
      excludeAssignmentIds: [id, dto.displacedAssignmentId],
      academicYearId: incoming.academicYearId,
    }, canForce);
    // Also validate displaced assignment at its new position
    await this.engine.validate({
      departmentId: dto.displacedDepartmentId,
      universityId: displaced.universityId,
      startDate: dto.displacedStartDate,
      endDate: dto.displacedEndDate,
      type: displaced.type,
      shiftType: displaced.shiftType,
      studentCount: displaced.studentCount,
      yearInProgram: displaced.yearInProgram,
      excludeAssignmentIds: [id, dto.displacedAssignmentId],
      academicYearId: incoming.academicYearId,
    }, canForce);
    const status = isAdminRole ? 'APPROVED' as const : 'PENDING' as const;

    const pendingMoveData: PendingMoveData | undefined = isAdminRole
      ? undefined
      : {
          originalDeptId: incoming.departmentId,
          originalStart: String(incoming.startDate),
          originalEnd: String(incoming.endDate),
          displacedId: dto.displacedAssignmentId,
          displacedOrigDeptId: displaced.departmentId,
          displacedOrigStart: String(displaced.startDate),
          displacedOrigEnd: String(displaced.endDate),
        };

    const approvedById = isAdminRole ? userId : undefined;

    return this.repository.displace(
      id,
      {
        departmentId: dto.departmentId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        displacedAssignmentId: dto.displacedAssignmentId,
        displacedDepartmentId: dto.displacedDepartmentId,
        displacedStartDate: dto.displacedStartDate,
        displacedEndDate: dto.displacedEndDate,
      },
      status,
      pendingMoveData,
      approvedById,
    );
  }
}
