import { useCallback, useState, useEffect } from 'react'
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
  const [waitedForProfile, setWaitedForProfile] = useState(false)
  const onSplashDone = useCallback(() => setSplashDone(true), [])

  // Margen para que el perfil llegue de la red. Con cache de localStorage,
  // normalmente el perfil ya está al instante y esto no se activa.
  useEffect(() => {
    if (!session || profile) { setWaitedForProfile(false); return }
    const t = setTimeout(() => setWaitedForProfile(true), 6000)
    return () => clearTimeout(t)
  }, [session, profile])

  if (!splashDone) return <BrandSplash onDone={onSplashDone} />

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

  // Hay sesión pero el perfil aún no llega Y todavía no agotamos el margen → spinner
  // (con cache esto rara vez se ve, pero protege a usuarios nuevos en red lenta)
  if (profile === null && !waitedForProfile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink-100">
        <Spinner size={28} className="text-brand-600" />
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
