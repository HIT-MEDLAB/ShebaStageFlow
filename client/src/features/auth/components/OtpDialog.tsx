import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { useVerifyOtp } from '../hooks/useVerifyOtp'
import { useLogin } from '../hooks/useLogin'
import type { LoginFormData } from '../schemas/auth.schema'

interface OtpDialogProps {
  open: boolean
  email: string
  otpToken: string
  loginData: LoginFormData
  onClose: () => void
  onOtpTokenUpdate: (newToken: string) => void
}

const OTP_LENGTH = 6

export function OtpDialog({ open, email, otpToken, loginData, onClose, onOtpTokenUpdate }: OtpDialogProps) {
  const { t } = useTranslation('auth')
  const [code, setCode] = useState('')
  const { mutate: verify, isPending: isVerifying } = useVerifyOtp(onClose)
  const { mutate: resendLogin, isPending: isResending } = useLogin()

  // Reset code when dialog opens
  useEffect(() => {
    if (open) {
      setCode('')
    }
  }, [open])

  const isCodeComplete = code.length === OTP_LENGTH

  function handleVerify() {
    if (!isCodeComplete) return
    verify({ otpToken, code })
  }

  function handleResend() {
    resendLogin(loginData, {
      onSuccess: (response) => {
        onOtpTokenUpdate(response.otpToken)
        setCode('')
      },
    })
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          if (!isVerifying) onClose()
          else e.preventDefault()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t('otp.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('otp.description', { email })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-center my-4" dir="ltr">
          <InputOTP maxLength={OTP_LENGTH} value={code} onChange={setCode} disabled={isVerifying}>
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
            onClick={handleResend}
            disabled={isResending || isVerifying}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? t('login.submitting') : t('otp.resend')}
          </button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isVerifying}>
            {t('otp.cancel')}
          </AlertDialogCancel>
          <Button
            onClick={handleVerify}
            disabled={!isCodeComplete || isVerifying}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isVerifying ? t('otp.verifying') : t('otp.verify')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
