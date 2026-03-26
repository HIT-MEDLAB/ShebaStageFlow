import { AppError } from '../../shared/errors/AppError';
import type { ConstraintRepository } from './constraint.repository';
import type {
  CreateSoftConstraintDto,
  UpdateSoftConstraintDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateUniversityWithSemesterDto,
  UpdateUniversityWithSemesterDto,
} from './constraint.schema';

export class ConstraintService {
  constructor(private readonly repository: ConstraintRepository) {}

  // ─── Scheduler (existing) ──────────────────────────────────

  async getConstraintsForYears(years: number[]) {
    const [departmentConstraints, ironConstraints, holidays, softConstraints] = await Promise.all([
      this.repository.findDepartmentConstraints(),
      this.repository.findIronConstraints(true),
      this.repository.findHolidays(years),
      this.repository.findActiveSoftConstraintsWithDates(),
    ]);

    return { departmentConstraints, ironConstraints, holidays, softConstraints };
  }

  // ─── Management (all constraint types) ─────────────────────

  async getAllConstraintsForManagement() {
    const [ironConstraints, dateConstraints, softConstraints, holidays, departments, universities] =
      await Promise.all([
        this.repository.findAllIronConstraints(),
        this.repository.findAllDateConstraints(),
        this.repository.findAllSoftConstraints(),
        this.repository.findAllHolidays(),
        this.repository.findAllDepartmentsWithConstraints(),
        this.repository.findAllUniversitiesWithSemesters(),
      ]);

    return { ironConstraints, dateConstraints, softConstraints, holidays, departments, universities };
  }

  // ─── Iron Constraints ──────────────────────────────────────

  async toggleIronConstraint(id: number, isActive: boolean) {
    const existing = await this.repository.findIronConstraintById(id);
    if (!existing) throw new AppError('Iron constraint not found', 404);
    return this.repository.toggleIronConstraint(id, isActive);
  }

  // ─── Date Constraints ──────────────────────────────────────

  async toggleDateConstraint(id: number, isActive: boolean) {
    const existing = await this.repository.findDateConstraintById(id);
    if (!existing) throw new AppError('Date constraint not found', 404);
    return this.repository.toggleDateConstraint(id, isActive);
  }

  // ─── Soft Constraints ──────────────────────────────────────

  async createSoftConstraint(data: CreateSoftConstraintDto) {
    return this.repository.createSoftConstraint(data);
  }

  async updateSoftConstraint(id: number, data: UpdateSoftConstraintDto) {
    const existing = await this.repository.findSoftConstraintById(id);
    if (!existing) throw new AppError('Soft constraint not found', 404);
    return this.repository.updateSoftConstraint(id, data);
  }

  async deleteSoftConstraint(id: number) {
    const existing = await this.repository.findSoftConstraintById(id);
    if (!existing) throw new AppError('Soft constraint not found', 404);
    return this.repository.deleteSoftConstraint(id);
  }

  async toggleSoftConstraint(id: number, isActive: boolean) {
    const existing = await this.repository.findSoftConstraintById(id);
    if (!existing) throw new AppError('Soft constraint not found', 404);
    return this.repository.toggleSoftConstraint(id, isActive);
  }

  // ─── Holidays ──────────────────────────────────────────────

  async toggleHoliday(id: number, isActive: boolean) {
    const existing = await this.repository.findHolidayById(id);
    if (!existing) throw new AppError('Holiday not found', 404);
    return this.repository.toggleHoliday(id, isActive);
  }

  // ─── Departments ───────────────────────────────────────────

  async createDepartmentWithConstraint(data: CreateDepartmentDto) {
    return this.repository.createDepartmentWithConstraint(data);
  }

  async updateDepartmentWithConstraint(id: number, data: UpdateDepartmentDto) {
    return this.repository.updateDepartmentWithConstraint(id, data);
  }

  // ─── Universities ──────────────────────────────────────────

  async createUniversityWithSemester(data: CreateUniversityWithSemesterDto) {
    return this.repository.createUniversityWithSemester(data);
  }

  async updateUniversityWithSemester(id: number, data: UpdateUniversityWithSemesterDto) {
    return this.repository.updateUniversityWithSemester(id, data);
  }
}
