import { AppError } from '../../shared/errors/AppError';
import type { IAcademicYearRepository } from './academic-year.repository';
import type { CreateAcademicYearDto, UpdateAcademicYearDto } from './academic-year.schema';

export class AcademicYearService {
  constructor(private readonly repository: IAcademicYearRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const academicYear = await this.repository.findById(id);
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }
    return academicYear;
  }

  async create(dto: CreateAcademicYearDto) {
    const existing = await this.repository.findByName(dto.name);
    if (existing) {
      throw new AppError('Academic year with this name already exists', 409);
    }
    return this.repository.create(dto);
  }

  async update(id: number, dto: UpdateAcademicYearDto) {
    await this.getById(id);
    if (dto.name) {
      const existing = await this.repository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new AppError('Academic year with this name already exists', 409);
      }
    }
    return this.repository.update(id, dto);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repository.remove(id);
  }
}
