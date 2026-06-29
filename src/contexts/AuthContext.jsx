import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, hasSupabaseEnv } from '../api/supabase'
import { getProfile } from '../api/profiles'
import { preloadFeed } from '../lib/feedPreloader'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null)
  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)

  // Sin fetchingRef — era la causa del bug de congelamiento.
  // Si llegan dos llamadas simultáneas simplemente la segunda sobreescribe, lo cual es correcto.
  const syncProfile = useCallback(async (uid) => {
    if (!uid) return
    try {
      const p = await getProfile(uid)
      if (p) {
        setProfile(p)
        setError('')
      }
    } catch (e) {
      console.warn('syncProfile:', e.message)
      setError(e.message)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const uid = supabase?.auth ? (await supabase.auth.getUser())?.data?.user?.id : null
    if (uid) await syncProfile(uid)
  }, [syncProfile])

  const checkMFA = useCallback(async (currentSession) => {
    if (!currentSession) { setMfaRequired(false); return }
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      setMfaRequired(data?.nextLevel === 'aal2' && data?.currentLevel === 'aal1')
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
    const safetyTimer = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    supabase.auth.getSession().then(async ({ data, error: se }) => {
      if (!mounted) return
      if (se) setError(se.message)
      const sess = data.session
      setSession(sess)
      clearTimeout(safetyTimer)
      setLoading(false)

      if (sess?.user) {
        // Perfil + MFA en paralelo, sin bloquear el render
        Promise.all([
          syncProfile(sess.user.id),
          checkMFA(sess),
        ]).then(() => {
          // Feed en background una vez que el perfil ya cargó
          if (mounted) preloadFeed(sess.user.id)
        }).catch(e => console.warn('Init:', e.message))
      }
    }).catch((e) => {
      clearTimeout(safetyTimer)
      if (mounted) { setError(e.message); setLoading(false) }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, ns) => {
      if (!mounted) return

      // TOKEN_REFRESHED: solo actualizar sesión, NO re-sincronizar perfil
      // Este evento llega cada ~55min y no indica cambio de usuario
      if (event === 'TOKEN_REFRESHED') {
        setSession(ns)
        return
      }

      // SIGNED_OUT: limpiar todo
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        setMfaRequired(false)
        return
      }

      // SIGNED_IN / USER_UPDATED: cargar perfil fresco
      setSession(ns)
      if (ns?.user) {
        await Promise.all([checkMFA(ns), syncProfile(ns.user.id)])
      } else {
        setProfile(null)
      }
      if (mounted) setLoading(false)
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
