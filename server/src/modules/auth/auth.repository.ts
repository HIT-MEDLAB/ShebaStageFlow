import prisma from '../../lib/prisma';

export interface AuthUserRecord {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  hashPassword: string;
  role: string;
  isActive: boolean;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  hashPassword?: string;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: number): Promise<AuthUserRecord | null>;
  updateProfile(id: number, data: UpdateProfileData): Promise<AuthUserRecord>;
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async updateProfile(id: number, data: UpdateProfileData): Promise<AuthUserRecord> {
    return prisma.user.update({ where: { id }, data });
  }
}
