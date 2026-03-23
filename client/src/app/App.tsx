import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth'

function App() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuth()

  async function handleLogout() {
    await clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">
        {user?.name ? t('home.welcomeBack', { name: user.name }) : t('home.welcomeBackDefault')}
      </h1>
      <p className="text-slate-500 text-sm">{t('home.signedIn')}</p>
      <Button variant="outline" onClick={handleLogout} className="mt-4 gap-2">
        <LogOut className="h-4 w-4" />
        {t('home.signOut')}
      </Button>
    </div>
  )
}

export default App
