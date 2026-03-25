import { AppError } from '../../shared/errors/AppError';
import type { IConstraintsRepository } from './constraints.repository';
import type {
  CreateIronConstraintDto,
  UpdateIronConstraintDto,
  CreateDateConstraintDto,
  UpdateDateConstraintDto,
  UpsertDepartmentConstraintDto,
  CreateSemesterDto,
  UpdateSemesterDto,
} from './constraints.schema';

export class ConstraintsService {
  constructor(private readonly repository: IConstraintsRepository) {}

  // ─── Iron Constraints ────────────────────────────────────

  async getAllIron() {
    return this.repository.findAllIron();
  }

  async createIron(dto: CreateIronConstraintDto) {
    return this.repository.createIron(dto);
  }

  async updateIron(id: number, dto: UpdateIronConstraintDto) {
    const existing = await this.repository.findIronById(id);
    if (!existing) {
      throw new AppError('Iron constraint not found', 404);
    }
    return this.repository.updateIron(id, dto);
  }

  async deleteIron(id: number) {
    const existing = await this.repository.findIronById(id);
    if (!existing) {
      throw new AppError('Iron constraint not found', 404);
    }
    return this.repository.deleteIron(id);
  }

  // ─── Date Constraints ────────────────────────────────────

  async getAllDate() {
    return this.repository.findAllDate();
  }

  async createDate(dto: CreateDateConstraintDto) {
    return this.repository.createDate(dto);
  }

  async updateDate(id: number, dto: UpdateDateConstraintDto) {
    const existing = await this.repository.findDateById(id);
    if (!existing) {
      throw new AppError('Date constraint not found', 404);
    }
    return this.repository.updateDate(id, dto);
  }

  async deleteDate(id: number) {
    const existing = await this.repository.findDateById(id);
    if (!existing) {
      throw new AppError('Date constraint not found', 404);
    }
    return this.repository.deleteDate(id);
  }

  // ─── Departments ─────────────────────────────────────────

  async getAllDepartments() {
    return this.repository.findAllDepartments();
  }

  async getDepartmentConstraint(departmentId: number) {
    return this.repository.findDepartmentConstraint(departmentId);
  }

  async upsertDepartmentConstraint(departmentId: number, dto: UpsertDepartmentConstraintDto) {
    return this.repository.upsertDepartmentConstraint(departmentId, dto);
  }

  // ─── Semesters ───────────────────────────────────────────

  async getSemesters(universityId: number) {
    return this.repository.findSemestersByUniversity(universityId);
  }

  async createSemester(dto: CreateSemesterDto) {
    const year = dto.semesterStart.getFullYear();

    try {
      return await this.repository.createSemester({
        universityId: dto.universityId,
        semesterStart: dto.semesterStart,
        semesterEnd: dto.semesterEnd,
        year,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        throw new AppError(
          `A semester already exists for this university in year ${year}`,
          409,
        );
      }
      throw error;
    }
  }

  async updateSemester(id: number, dto: UpdateSemesterDto) {
    const existing = await this.repository.findSemesterById(id);
    if (!existing) {
      throw new AppError('Semester not found', 404);
    }

    const updateData: { semesterStart?: Date; semesterEnd?: Date; year?: number } = {};

    if (dto.semesterStart) {
      updateData.semesterStart = dto.semesterStart;
      updateData.year = dto.semesterStart.getFullYear();
    }
    if (dto.semesterEnd) {
      updateData.semesterEnd = dto.semesterEnd;
    }

    return this.repository.updateSemester(id, updateData);
  }
}
