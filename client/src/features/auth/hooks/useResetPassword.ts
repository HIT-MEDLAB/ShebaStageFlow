import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { resetPassword } from '../api/auth.api'

export function useResetPassword() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: { otpToken: string; code: string; newPassword: string }) =>
      resetPassword(data),
    onSuccess: () => {
      toast.success(t('toast.resetPasswordSuccess'))
      navigate('/login')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.resetPasswordError')
      toast.error(message)
    },
  })
}
