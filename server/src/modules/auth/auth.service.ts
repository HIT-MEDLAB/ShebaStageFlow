import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../../shared/errors/AppError';
import { sendOtpEmail } from '../../shared/utils/email';
import type { IAuthRepository } from './auth.repository';
import type { IOtpRepository } from './otp.repository';
import type { LoginDto } from './auth.schema';

interface UserShape {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginOtpResult {
  requiresOtp: true;
  otpToken: string;
  email: string;
}

interface VerifyOtpResult {
  token: string;
  user: UserShape;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

export class AuthService {
  constructor(
    private readonly repository: IAuthRepository,
    private readonly otpRepository: IOtpRepository,
  ) {}

  async login(dto: LoginDto): Promise<LoginOtpResult> {
    const user = await this.repository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(dto.password, user.hashPassword);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Invalidate any previous unused OTPs
    await this.otpRepository.invalidateAllForUser(user.id);

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Generate a random lookup token (no JWT until OTP is verified)
    const otpToken = crypto.randomBytes(32).toString('hex');

    await this.otpRepository.create(user.id, code, otpToken, expiresAt);

    // Send OTP via email
    await sendOtpEmail(user.email, code);

    return {
      requiresOtp: true,
      otpToken,
      email: maskEmail(user.email),
    };
  }

  async verifyOtp(otpToken: string, code: string): Promise<VerifyOtpResult> {
    const otp = await this.otpRepository.findByToken(otpToken, code);
    if (!otp) {
      throw new AppError('Invalid or expired OTP code', 401);
    }

    await this.otpRepository.markUsed(otp.id);

    // Fetch user for response
    const user = await this.repository.findById(otp.userId);
    if (!user || !user.isActive) {
      throw new AppError('Authentication required', 401);
    }

    // Issue the real auth JWT
    const secret = getJwtSecret();
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
