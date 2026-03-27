import prisma from '../../lib/prisma';

export class CoordinatorRepository {
  async findAllActive() {
    return prisma.user.findMany({
      where: { role: 'ACADEMIC_COORDINATOR', isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: { name: string; email: string; phone?: string; hashPassword: string }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        hashPassword: data.hashPassword,
        role: 'ACADEMIC_COORDINATOR',
      },
    });
  }

  async update(id: number, data: { name?: string; email?: string; phone?: string }) {
    return prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: number) {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
