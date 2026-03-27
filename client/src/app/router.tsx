import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { GuestRoute } from '@/components/shared/GuestRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/features/home'
import { SettingsPage } from '@/features/settings'
import { SchedulerPage } from '@/features/scheduler'
import { ConstraintsPage } from '@/features/constraints'
import { CoordinatorsPage } from '@/features/academic-coordinators'
import { AdminsPage } from '@/features/admin-management'
import { StatisticsPage } from '@/features/statistics'
import { NotFoundPage } from '@/components/shared/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/home',
            element: <HomePage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
          {
            path: '/scheduler',
            element: (
              <Suspense fallback={null}>
                <SchedulerPage />
              </Suspense>
            ),
          },
          {
            path: '/constraints',
            element: (
              <Suspense fallback={null}>
                <ConstraintsPage />
              </Suspense>
            ),
          },
          {
            path: '/statistics',
            element: <StatisticsPage />,
          },
          {
            path: '/coordinators',
            element: <CoordinatorsPage />,
          },
          {
            path: '/admins',
            element: <AdminsPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
