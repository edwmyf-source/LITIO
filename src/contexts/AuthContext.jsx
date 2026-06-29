import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, hasSupabaseEnv } from '../api/supabase'
import { getProfile } from '../api/profiles'
import { preloadFeed } from '../lib/feedPreloader'

const AuthCtx = createContext(null)

// Cache de perfil persistente entre montajes (stale-while-revalidate)
// Si el usuario recarga, mostramos el perfil en caché mientras validamos en segundo plano.
let _profileCache = null
let _profileUid   = null

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null)
  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const fetchingRef = useRef(false)

  const syncProfile = useCallback(async (uid, { silent = false } = {}) => {
    // Evita fetches duplicados simultáneos
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      // Si tenemos caché del mismo user, mostramos al instante y refrescamos en silencio
      if (_profileCache && _profileUid === uid && !silent) {
        setProfile(_profileCache)
      }
      const p = await getProfile(uid)
      _profileCache = p
      _profileUid   = uid
      setProfile(p)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await syncProfile(session.user.id, { silent: true })
  }, [session?.user?.id, syncProfile])

  const checkMFA = useCallback(async (currentSession) => {
    if (!currentSession) { setMfaRequired(false); return }
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
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
    const safetyTimer = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    supabase.auth.getSession().then(async ({ data, error: se }) => {
      if (!mounted) return
      if (se) setError(se.message)
      setSession(data.session)
      clearTimeout(safetyTimer)
      if (mounted) setLoading(false)
      // MFA y perfil en paralelo — ninguno bloquea el primer render
      try {
        await Promise.all([
          checkMFA(data.session),
          data.session?.user ? syncProfile(data.session.user.id) : Promise.resolve(),
        ])
        // Precarga el feed durante el splash — sin await, corre en background
        if (data.session?.user?.id) preloadFeed(data.session.user.id)
      } catch (e) {
        if (mounted) console.warn('Carga inicial:', e.message)
      }
    }).catch((e) => {
      clearTimeout(safetyTimer)
      if (mounted) { setError(e.message); setLoading(false) }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, ns) => {
      if (!mounted) return
      if (event === 'TOKEN_REFRESHED') {
        setSession(prev => prev ?? ns)
        return
      }
      setSession(ns)
      try {
        await Promise.all([
          checkMFA(ns),
          ns?.user ? syncProfile(ns.user.id) : Promise.resolve(setProfile(null)),
        ])
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
