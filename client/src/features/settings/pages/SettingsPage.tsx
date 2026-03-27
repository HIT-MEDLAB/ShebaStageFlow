import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor, Pencil } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { EditProfileDialog } from '../components/EditProfileDialog'

export function SettingsPage() {
  const { t, i18n } = useTranslation('settings')
  const { theme, setTheme } = useThemeStore()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  function handleLanguageChange(value: string) {
    i18n.changeLanguage(value)
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
   <div className="mx-auto w-full px-8 space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>

      {user && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('profile.title')}</CardTitle>
                <CardDescription>{t('profile.description')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('profile.editButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="grid flex-1 gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="secondary">
                    {t(`profile.roles.${user.role}`)}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{user.email}</div>
                {user.phone && (
                  <div className="text-muted-foreground">{user.phone}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('language.title')}</CardTitle>
          <CardDescription>{t('language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('language.en')}</SelectItem>
              <SelectItem value="he">{t('language.he')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('appearance.title')}</CardTitle>
          <CardDescription>{t('appearance.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(value) => {
              if (value) setTheme(value as Theme)
            }}
          >
            <ToggleGroupItem value="light" className="gap-2 px-4">
              <Sun className="h-4 w-4" />
              {t('appearance.light')}
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" className="gap-2 px-4">
              <Moon className="h-4 w-4" />
              {t('appearance.dark')}
            </ToggleGroupItem>
            <ToggleGroupItem value="system" className="gap-2 px-4">
              <Monitor className="h-4 w-4" />
              {t('appearance.system')}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      {user && (
        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
      )}
    </div>
  )
}
