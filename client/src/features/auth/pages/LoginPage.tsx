import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useLogin } from '../hooks/useLogin'
import { createLoginSchema, type LoginFormData } from '../schemas/auth.schema'
import { useAuth } from '../hooks/useAuth'
import { OtpDialog } from '../components/OtpDialog'

interface OtpState {
  otpToken: string
  email: string
}

export function LoginPage() {
  const { t, i18n } = useTranslation('auth')
  const { isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [otpState, setOtpState] = useState<OtpState | null>(null)
  const { mutate: login, isPending } = useLogin()

  const loginSchema = useMemo(() => createLoginSchema(t), [i18n.language])

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  function onSubmit(data: LoginFormData) {
    login(data, {
      onSuccess: (response) => {
        if (response.requiresOtp) {
          setOtpState({ otpToken: response.otpToken, email: response.email })
        }
      },
    })
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
    'focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://www.sheba.co.il/cms-media/media/o1npqdhe/%D7%A9%D7%99%D7%91%D7%90.svg"
            alt="Sheba Medical Center"
            className="h-16 object-contain"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {t('login.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('login.emailPlaceholder')}
              disabled={isPending}
              className={inputClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t('login.passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                disabled={isPending}
                className={`${inputClass} pr-10`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                {...register('rememberMe')}
              />
              {t('login.rememberMe')}
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
          >
            {isPending ? t('login.submitting') : t('login.submit')}
          </Button>

        </form>
      </div>

      {/* OTP Dialog */}
      {otpState && (
        <OtpDialog
          open={!!otpState}
          email={otpState.email}
          otpToken={otpState.otpToken}
          loginData={getValues()}
          onClose={() => setOtpState(null)}
          onOtpTokenUpdate={(newToken) => setOtpState((prev) => prev ? { ...prev, otpToken: newToken } : null)}
        />
      )}
    </div>
  )
}
