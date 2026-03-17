import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { GuestRoute } from '@/components/shared/GuestRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import App from '@/app/App'

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
            element: <App />,
          },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
