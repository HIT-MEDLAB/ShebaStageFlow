import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/AppError';
import type { IAuthRepository } from './auth.repository';
import type { LoginDto } from './auth.schema';

interface UserShape {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResult {
  token: string;
  user: UserShape;
}

export class AuthService {
  constructor(private readonly repository: IAuthRepository) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.repository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(dto.password, user.hashPassword);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '8h' },
    );

    return {
      token,
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name ?? '',
        role: user.role,
      },
    };
  }

  async getMe(userId: number): Promise<UserShape> {
    const user = await this.repository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('Authentication required', 401);
    }

    return {
      id: String(user.id),
      email: user.email,
      name: user.name ?? '',
      role: user.role,
    };
  }
}
