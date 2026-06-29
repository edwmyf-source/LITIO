import { useCallback, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/shared/Toast'
import BrandSplash from './components/shared/BrandSplash'
import AuthScreen from './components/auth/AuthScreen'
import MFAVerifyForm from './components/auth/MFAVerifyForm'
import ProfileSetup from './components/profile/ProfileSetup'
import Spinner from './components/shared/Spinner'
import { routes } from './routes'

const router = createBrowserRouter(routes)

function AppInner() {
  const { session, profile, loading, error, mfaRequired, setMfaRequired } = useAuth()
  const [splashDone, setSplashDone] = useState(false)
  const onSplashDone = useCallback(() => setSplashDone(true), [])

  // Splash y auth corren EN PARALELO.
  // Mostramos splash mientras la app se inicializa detrás.
  // Cuando ambas terminan (splash 3s + auth ~300ms), mostramos la app al instante.
  if (!splashDone) return <BrandSplash onDone={onSplashDone} />

  // Auth ya debería estar lista (terminó mucho antes que el splash)
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink-100">
        <Spinner size={28} className="text-brand-600" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink-100 p-4">
        <div className="bg-white rounded-2xl border border-ink-300 p-6 max-w-md">
          <p className="text-danger-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!session) return <AuthScreen />

  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-ink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-ink-300 p-8 shadow-sm">
          <MFAVerifyForm
            onSuccess={() => setMfaRequired(false)}
            onCancel={() => { import('./api/auth').then(m => m.signOut()) }}
          />
        </div>
      </div>
    )
  }

  const profileComplete = profile?.full_name && profile?.city
  if (!profileComplete) return <ProfileSetup />

  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ToastProvider>
  )
}
