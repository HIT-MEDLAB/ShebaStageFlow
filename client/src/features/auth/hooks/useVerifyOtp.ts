import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { verifyOtp } from '../api/auth.api'
import { useAuth } from './useAuth'

export function useVerifyOtp(onClose?: () => void) {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { setUser } = useAuth()

  return useMutation({
    mutationFn: ({ otpToken, code }: { otpToken: string; code: string }) =>
      verifyOtp(otpToken, code),
    onSuccess: (response) => {
      setUser(response.user)
      onClose?.()
      toast.success(t('toast.welcomeBack'))
      navigate('/home')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.otpInvalid')
      toast.error(message)
    },
  })
}
