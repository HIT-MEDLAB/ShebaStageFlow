import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { useForgotPassword } from '../hooks/useForgotPassword'
import { useResetPassword } from '../hooks/useResetPassword'
import {
  createForgotPasswordSchema,
  createResetPasswordSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from '../schemas/auth.schema'

type Step = 'email' | 'otp' | 'reset'

const OTP_LENGTH = 6

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation('auth')
  const [step, setStep] = useState<Step>('email')
  const [otpToken, setOtpToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailForResend, setEmailForResend] = useState('')

  const { mutate: sendOtp, isPending: isSendingOtp } = useForgotPassword()
  const { mutate: resetPw, isPending: isResetting } = useResetPassword()

  const forgotPasswordSchema = useMemo(() => createForgotPasswordSchema(t), [i18n.language])
  const resetPasswordSchema = useMemo(() => createResetPasswordSchema(t), [i18n.language])

  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  function handleEmailSubmit(data: ForgotPasswordFormData) {
    setEmailForResend(data.email)
    sendOtp(data, {
      onSuccess: (response) => {
        if (response.otpToken) {
          setOtpToken(response.otpToken)
          setMaskedEmail(response.email)
          setStep('otp')
        }
      },
    })
  }

  function handleOtpComplete() {
    if (otpCode.length === OTP_LENGTH) {
      setStep('reset')
    }
  }

  function handleResendOtp() {
    sendOtp({ email: emailForResend }, {
      onSuccess: (response) => {
        if (response.otpToken) {
          setOtpToken(response.otpToken)
          setOtpCode('')
        }
      },
    })
  }

  function handleResetSubmit(data: ResetPasswordFormData) {
    resetPw({
      otpToken,
      code: otpCode,
      newPassword: data.newPassword,
    })
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
    'focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="flex justify-center mb-8">
          <img
            src="https://www.sheba.co.il/cms-media/media/o1npqdhe/%D7%A9%D7%99%D7%91%D7%90.svg"
            alt="Sheba Medical Center"
            className="h-16 object-contain"
          />
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-slate-900">
                {t('forgotPassword.title')}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t('forgotPassword.description')}
              </p>
            </div>

            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  {t('forgotPassword.emailLabel')}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  disabled={isSendingOtp}
                  className={inputClass}
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSendingOtp}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
              >
                {isSendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSendingOtp ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
              </Button>
            </form>
          </>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-slate-900">
                {t('otp.title')}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t('otp.description', { email: maskedEmail })}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex justify-center" dir="ltr">
                <InputOTP maxLength={OTP_LENGTH} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSendingOtp ? t('forgotPassword.submitting') : t('otp.resend')}
                </button>
              </div>

              <Button
                onClick={handleOtpComplete}
                disabled={otpCode.length !== OTP_LENGTH}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
              >
                {t('forgotPassword.continue')}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-slate-900">
                {t('forgotPassword.newPasswordTitle')}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t('forgotPassword.newPasswordDescription')}
              </p>
            </div>

            <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  {t('forgotPassword.newPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('forgotPassword.newPasswordPlaceholder')}
                    disabled={isResetting}
                    className={`${inputClass} pr-10`}
                    {...resetForm.register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-600">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  {t('forgotPassword.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                    disabled={isResetting}
                    className={`${inputClass} pr-10`}
                    {...resetForm.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isResetting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
              >
                {isResetting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isResetting ? t('forgotPassword.resettingPassword') : t('forgotPassword.resetPassword')}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>

      </div>
    </div>
  )
}
