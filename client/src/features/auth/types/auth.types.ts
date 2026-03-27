export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACADEMIC_COORDINATOR'

export interface AuthUser {
  id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
}
