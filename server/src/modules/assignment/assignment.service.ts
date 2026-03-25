import { AppError } from '../../shared/errors/AppError';
import type { IAssignmentRepository, AssignmentFilters } from './assignment.repository';
import type {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  MoveAssignmentDto,
  ImportAssignmentsDto,
  AddStudentDto,
  ImportStudentsDto,
} from './assignment.schema';

export class AssignmentService {
  constructor(private readonly repository: IAssignmentRepository) {}

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

  async create(dto: CreateAssignmentDto, userId: number) {
    return this.repository.create(dto, userId);
  }

  async update(id: number, dto: UpdateAssignmentDto) {
    await this.getById(id);
    return this.repository.update(id, dto);
  }

  async move(id: number, dto: MoveAssignmentDto) {
    await this.getById(id);
    return this.repository.move(id, dto.departmentId, dto.startDate, dto.endDate);
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
}
