import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { forgotPassword } from '../api/auth.api'
import type { ForgotPasswordFormData } from '../schemas/auth.schema'

export function useForgotPassword() {
  const { t } = useTranslation('auth')

  return useMutation({
    mutationFn: (data: ForgotPasswordFormData) => forgotPassword(data),
    onSuccess: () => {
      toast.success(t('toast.forgotPasswordSuccess'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.forgotPasswordError')
      toast.error(message)
    },
  })
}
