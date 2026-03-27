import crypto from 'crypto';
import bcrypt from 'bcrypt';
import type { AdminRepository } from './admin.repository';
import type { CreateAdminDto, UpdateAdminDto } from './admin.schema';
import { AppError } from '../../shared/errors/AppError';
import { sendWelcomeEmail } from '../../shared/utils/email';

export class AdminService {
  constructor(private repository: AdminRepository) {}

  async getAll() {
    const admins = await this.repository.findAllActive();
    return admins.map((a) => {
      const { firstName, lastName } = this.splitName(a.name ?? '');
      return {
        id: a.id,
        firstName,
        lastName,
        email: a.email,
        phone: a.phone,
      };
    });
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new AppError('A user with this email already exists', 409);
    }

    const password = crypto.randomBytes(8).toString('base64url');
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${dto.firstName} ${dto.lastName}`;

    const user = await this.repository.create({
      name,
      email: dto.email,
      phone: dto.phone,
      hashPassword: hashedPassword,
    });

    await sendWelcomeEmail(dto.email, password);

    const { firstName, lastName } = this.splitName(user.name ?? '');
    return { id: user.id, firstName, lastName, email: user.email, phone: user.phone };
  }

  async update(id: number, dto: UpdateAdminDto) {
    const user = await this.repository.findById(id);
    if (!user || !user.isActive) {
      throw new AppError('Admin not found', 404);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.repository.findByEmail(dto.email);
      if (existing) {
        throw new AppError('A user with this email already exists', 409);
      }
    }

    const { firstName: existingFirst, lastName: existingLast } = this.splitName(user.name ?? '');
    const newFirst = dto.firstName ?? existingFirst;
    const newLast = dto.lastName ?? existingLast;
    const name = `${newFirst} ${newLast}`;

    const updated = await this.repository.update(id, {
      name,
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });

    const split = this.splitName(updated.name ?? '');
    return { id: updated.id, firstName: split.firstName, lastName: split.lastName, email: updated.email, phone: updated.phone };
  }

  async delete(id: number) {
    const user = await this.repository.findById(id);
    if (!user || user.role !== 'ADMIN' || !user.isActive) {
      throw new AppError('Admin not found', 404);
    }
    await this.repository.softDelete(id);
  }

  private splitName(fullName: string): { firstName: string; lastName: string } {
    const spaceIndex = fullName.indexOf(' ');
    if (spaceIndex === -1) {
      return { firstName: fullName, lastName: '' };
    }
    return {
      firstName: fullName.substring(0, spaceIndex),
      lastName: fullName.substring(spaceIndex + 1),
    };
  }
}
