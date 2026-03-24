import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { loginUser } from '../api/auth.api'
import type { LoginFormData } from '../schemas/auth.schema'

export function useLogin() {
  const { t } = useTranslation('auth')

  return useMutation({
    mutationFn: (data: LoginFormData) => loginUser(data),
    onSuccess: () => {
      toast.success(t('toast.otpSent'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.invalidCredentials')
      toast.error(message)
    },
  })
}
