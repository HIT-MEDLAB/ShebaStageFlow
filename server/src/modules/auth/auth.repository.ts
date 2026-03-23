import prisma from '../../lib/prisma';

export interface AuthUserRecord {
  id: number;
  email: string;
  name: string | null;
  hashPassword: string;
  role: string;
  isActive: boolean;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: number): Promise<AuthUserRecord | null>;
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
