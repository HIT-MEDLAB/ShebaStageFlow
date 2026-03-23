import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    function applyTheme(dark: boolean) {
      root.classList.toggle('dark', dark)
    }

    if (theme !== 'system') {
      applyTheme(theme === 'dark')
      return
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mql.matches)

    function onChange(e: MediaQueryListEvent) {
      applyTheme(e.matches)
    }

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [theme])

  return <>{children}</>
}
