import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor } from 'lucide-react'
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
import { useThemeStore, type Theme } from '@/stores/themeStore'

export function SettingsPage() {
  const { t, i18n } = useTranslation('settings')
  const { theme, setTheme } = useThemeStore()

  function handleLanguageChange(value: string) {
    i18n.changeLanguage(value)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>

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
    </div>
  )
}
