import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { loginUser } from '../api/auth.api'
import { useAuth } from './useAuth'
import type { LoginFormData } from '../schemas/auth.schema'

export function useLogin() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { setUser } = useAuth()

  return useMutation({
    mutationFn: (data: LoginFormData) => loginUser(data),
    onSuccess: (response) => {
      setUser(response.user)
      toast.success(t('toast.welcomeBack'))
      navigate('/home')
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
