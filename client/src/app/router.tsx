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
            element: <ConstraintsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])