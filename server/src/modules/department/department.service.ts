import type { IDepartmentRepository } from './department.repository';

export class DepartmentService {
  constructor(private readonly repository: IDepartmentRepository) {}

  async getAll(academicYearId?: number) {
    return this.repository.findAll(academicYearId);
  }
}
