import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, hasSupabaseEnv } from '../api/supabase'
import { getProfile } from '../api/profiles'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null)
  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)

  const syncProfile = useCallback(async (uid) => {
    try {
      const p = await getProfile(uid)
      setProfile(p)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await syncProfile(session.user.id)
  }, [session?.user?.id, syncProfile])

  const checkMFA = useCallback(async (currentSession) => {
    if (!currentSession) { setMfaRequired(false); return }
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      // nextLevel > currentLevel significa que hay factores enrollados pero no verificados en esta sesión
      if (data?.nextLevel === 'aal2' && data?.currentLevel === 'aal1') {
        setMfaRequired(true)
      } else {
        setMfaRequired(false)
      }
    } catch {
      setMfaRequired(false)
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false)
      setError('Faltan variables de entorno de Supabase.')
      return
    }

    let mounted = true

    // Safety: si Supabase se cuelga (red lenta / caído), loading siempre llega a false en ≤8s
    const safetyTimer = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    supabase.auth.getSession().then(async ({ data, error: se }) => {
      if (!mounted) return
      if (se) setError(se.message)
      setSession(data.session)
      // Liberamos loading apenas tenemos sesión: la app se muestra YA.
      // El perfil se carga en paralelo sin bloquear el primer render.
      clearTimeout(safetyTimer)
      if (mounted) setLoading(false)
      try {
        await checkMFA(data.session)
        if (data.session?.user) await syncProfile(data.session.user.id)
      } catch (e) {
        if (mounted) console.warn('Carga de perfil:', e.message)
      }
    }).catch((e) => {
      clearTimeout(safetyTimer)
      if (mounted) { setError(e.message); setLoading(false) }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, ns) => {
      if (!mounted) return

      // TOKEN_REFRESHED se dispara solo cada ~minuto. Si el usuario es el mismo,
      // NO re-sincronizamos nada: actualizar session/profile aquí causaba un
      // re-render en cascada de toda la app → la app se "congelaba" al minuto.
      if (event === 'TOKEN_REFRESHED') {
        setSession(prev => prev ?? ns)   // mantener referencia previa si ya existe
        return
      }

      // Solo reaccionar a cambios reales: login, logout, cambio de usuario
      setSession(ns)
      try {
        await checkMFA(ns)
        if (!ns?.user) { setProfile(null); return }
        await syncProfile(ns.user.id)
      } catch (e) {
        console.warn('Auth state change:', e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [syncProfile, checkMFA])

  return (
    <AuthCtx.Provider value={{ session, profile, setProfile, refreshProfile, loading, error, mfaRequired, setMfaRequired }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
