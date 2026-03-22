import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useForgotPassword } from '../hooks/useForgotPassword'
import { createForgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schema'

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation('auth')
  const { mutate: sendResetLink, isPending } = useForgotPassword()

  const forgotPasswordSchema = useMemo(() => createForgotPasswordSchema(t), [i18n.language])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(data: ForgotPasswordFormData) {
    sendResetLink(data)
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

        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-slate-900">
            {t('forgotPassword.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('forgotPassword.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {t('forgotPassword.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('forgotPassword.emailPlaceholder')}
              disabled={isPending}
              className={inputClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
          >
            {isPending ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
          </Button>

        </form>

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
