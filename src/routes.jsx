import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Spinner from './components/shared/Spinner'
import { useAuth } from './contexts/AuthContext'
import { isAdmin } from './lib/constants'

const FeedPage = lazy(() => import('./pages/FeedPage'))
const ChatsPage = lazy(() => import('./pages/ChatsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const HerramientasPage = lazy(() => import('./pages/HerramientasPage'))
const QuimicaGamePage = lazy(() => import('./pages/QuimicaGamePage'))

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={24} className="text-brand-600" />
    </div>
  )
}

function RequireAdmin({ children }) {
  const { profile, session } = useAuth()
  if (!isAdmin(profile, session?.user?.email)) return <Navigate to="/feed" replace />
  return children
}

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export const routes = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/feed" replace /> },
      { path: 'feed', element: <Page><FeedPage /></Page> },
      { path: 'chats', element: <Page><ChatsPage /></Page> },
      { path: 'notifications', element: <Page><NotificationsPage /></Page> },
      { path: 'profile', element: <Page><ProfilePage /></Page> },
      { path: 'u/:userId', element: <Page><UserProfilePage /></Page> },
      { path: 'contact', element: <Page><ContactPage /></Page> },
      { path: 'herramientas', element: <Page><HerramientasPage /></Page> },
      { path: 'quimica', element: <Page><QuimicaGamePage /></Page> },
      {
        path: 'admin',
        element: <RequireAdmin><Page><AdminPage /></Page></RequireAdmin>,
      },
      { path: '*', element: <Navigate to="/feed" replace /> },
    ],
  },
]
