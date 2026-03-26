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
} from './assignment.schema';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ACADEMIC_COORDINATOR';

export class AssignmentService {
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

  async create(dto: CreateAssignmentDto, userId: number, userRole: string) {
    const status = this.determineStatus(userRole);
    const approvedById = this.isAdmin(userRole) ? userId : undefined;
    return this.repository.create(dto, userId, status, approvedById);
  }

  async update(id: number, dto: UpdateAssignmentDto) {
    await this.getById(id);
    return this.repository.update(id, dto);
  }

  async move(id: number, dto: MoveAssignmentDto, userId: number, userRole: string) {
    await this.getById(id);
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
    await this.getById(assignmentId);
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

  async displace(id: number, dto: DisplaceAssignmentDto, userId: number, userRole: string) {
    await this.getById(id);

    // Get the incoming assignment's current position (for pendingMoveData)
    const incoming = await this.getById(id) as { departmentId: number; startDate: string; endDate: string };
    // Get displaced assignment's current position
    const displaced = await this.getById(dto.displacedAssignmentId) as { departmentId: number; startDate: string; endDate: string };

    const isAdminRole = this.isAdmin(userRole);
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
