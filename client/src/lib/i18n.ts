import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from '@/locales/en/common.json'
import enAuth from '@/locales/en/auth.json'
import enHome from '@/locales/en/home.json'
import enSettings from '@/locales/en/settings.json'
import enScheduler from '@/locales/en/scheduler.json'
import enConstraints from '@/locales/en/constraints.json'
import enCoordinators from '@/locales/en/coordinators.json'
import enAdmins from '@/locales/en/admins.json'
import heCommon from '@/locales/he/common.json'
import heAuth from '@/locales/he/auth.json'
import heHome from '@/locales/he/home.json'
import heSettings from '@/locales/he/settings.json'
import heScheduler from '@/locales/he/scheduler.json'
import heConstraints from '@/locales/he/constraints.json'
import heCoordinators from '@/locales/he/coordinators.json'
import heAdmins from '@/locales/he/admins.json'
import enStatistics from '@/locales/en/statistics.json'
import heStatistics from '@/locales/he/statistics.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, home: enHome, settings: enSettings, scheduler: enScheduler, constraints: enConstraints, coordinators: enCoordinators, admins: enAdmins, statistics: enStatistics },
      he: { common: heCommon, auth: heAuth, home: heHome, settings: heSettings, scheduler: heScheduler, constraints: heConstraints, coordinators: heCoordinators, admins: heAdmins, statistics: heStatistics },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'home', 'settings', 'scheduler', 'constraints', 'coordinators', 'admins', 'statistics'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

// Set document direction on language change
function updateDirection(lng: string) {
  const dir = lng === 'he' ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lng
}

updateDirection(i18n.language)
i18n.on('languageChanged', updateDirection)

export default i18n
