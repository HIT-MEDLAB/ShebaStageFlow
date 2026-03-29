import { AppError } from '../../shared/errors/AppError';
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
} from './assignment.schema';
import { ConstraintEngine, validateStudentLink } from './validation/constraintEngine';
import { ConstraintValidationError } from '../../shared/errors/ConstraintValidationError';
import { ImportValidationService } from './import/importService';
import type { ImportValidationResult } from './import/importTypes';
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
    }, canForce);

    const status = this.determineStatus(userRole);
    const approvedById = this.isAdmin(userRole) ? userId : undefined;
    const result = await this.repository.create(dto, userId, status, approvedById);
    return { ...result, warnings };
  }

  async update(id: number, dto: UpdateAssignmentDto) {
    await this.getById(id);
    return this.repository.update(id, dto);
  }

  async move(id: number, dto: MoveAssignmentDto, userId: number, userRole: string, forceOverride?: boolean) {
    const existing = await this.getById(id) as { universityId: number; type: 'GROUP' | 'ELECTIVE'; shiftType: 'MORNING' | 'EVENING'; studentCount?: number | null; yearInProgram?: number | null };
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
    }, canForce);

    const status = this.isAdmin(userRole) ? 'APPROVED' as const : undefined;
    const approvedById = this.isAdmin(userRole) ? userId : undefined;
    return this.repository.move(id, dto.departmentId, dto.startDate, dto.endDate, status, approvedById);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repository.remove(id);
  }

  async importAssignments(dto: ImportAssignmentsDto, userId: number) {
    return this.repository.bulkCreate(dto.assignments, userId);
  }

  async addStudent(assignmentId: number, dto: AddStudentDto) {
    const assignment = await this.getById(assignmentId) as { startDate: Date; endDate: Date; shiftType: 'MORNING' | 'EVENING' };

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

    return this.repository.addStudent(assignmentId, dto);
  }

  async removeStudent(assignmentId: number, studentId: number) {
    await this.getById(assignmentId);
    return this.repository.removeStudent(assignmentId, studentId);
  }

  async importStudents(assignmentId: number, dto: ImportStudentsDto) {
    await this.getById(assignmentId);
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

    await prisma.$transaction(async (tx) => {
      for (const action of dto.actions) {
        const actionDto = action.dto;

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
            },
          });
          created++;
        }
      }
    });

    return { created, displaced };
  }

  async displace(id: number, dto: DisplaceAssignmentDto, userId: number, userRole: string, forceOverride?: boolean) {
    await this.getById(id);

    // Get the incoming assignment's current position (for pendingMoveData)
    const incoming = await this.getById(id) as { departmentId: number; startDate: string; endDate: string; universityId: number; type: 'GROUP' | 'ELECTIVE'; shiftType: 'MORNING' | 'EVENING'; studentCount?: number | null; yearInProgram?: number | null };
    // Get displaced assignment's current position
    const displaced = await this.getById(dto.displacedAssignmentId) as { departmentId: number; startDate: string; endDate: string };

    const isAdminRole = this.isAdmin(userRole);
    const canForce = isAdminRole && forceOverride;
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
