import prisma from '../../lib/prisma';

export interface IOtpRepository {
  create(userId: number, code: string, token: string, expiresAt: Date): Promise<{ id: number }>;
  findByToken(token: string, code: string): Promise<{ id: number; userId: number } | null>;
  markUsed(id: number): Promise<void>;
  invalidateAllForUser(userId: number): Promise<void>;
}

export class OtpRepository implements IOtpRepository {
  async create(userId: number, code: string, token: string, expiresAt: Date) {
    return prisma.otpCode.create({
      data: { userId, code, token, expiresAt },
      select: { id: true },
    });
  }

  async findByToken(token: string, code: string) {
    return prisma.otpCode.findFirst({
      where: {
        token,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });
  }

  async markUsed(id: number) {
    await prisma.otpCode.update({
      where: { id },
      data: { used: true },
    });
  }

  async invalidateAllForUser(userId: number) {
    await prisma.otpCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });
  }
}
