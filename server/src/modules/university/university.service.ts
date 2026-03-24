import { AppError } from '../../shared/errors/AppError';
import type { IUniversityRepository } from './university.repository';
import type { CreateUniversityDto, UpdateUniversityDto } from './university.schema';

export class UniversityService {
  constructor(private readonly repository: IUniversityRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: number) {
    const university = await this.repository.findById(id);
    if (!university) {
      throw new AppError('University not found', 404);
    }
    return university;
  }

  async create(dto: CreateUniversityDto) {
    const existing = await this.repository.findByName(dto.name);
    if (existing) {
      throw new AppError('University with this name already exists', 409);
    }
    return this.repository.create(dto);
  }

  async update(id: number, dto: UpdateUniversityDto) {
    await this.getById(id);
    if (dto.name) {
      const existing = await this.repository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new AppError('University with this name already exists', 409);
      }
    }
    return this.repository.update(id, dto);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repository.remove(id);
  }
}
