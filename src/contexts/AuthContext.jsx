import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, hasSupabaseEnv } from '../api/supabase'
import { getProfile } from '../api/profiles'
import { preloadFeed } from '../lib/feedPreloader'

const AuthCtx = createContext(null)

// ── Cache de perfil en localStorage ──────────────────────────────────────────
// Al recargar la página, el perfil aparece AL INSTANTE desde aquí, sin esperar
// la red. Esto elimina el bug de "pide datos de nuevo al actualizar".
const PROFILE_KEY = 'rodio-profile'

function loadCachedProfile(uid) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    // Solo usar si es del mismo usuario
    return cached?.id === uid ? cached : null
  } catch { return null }
}

function saveCachedProfile(profile) {
  try {
    if (profile?.id) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {}
}

function clearCachedProfile() {
  try { localStorage.removeItem(PROFILE_KEY) } catch {}
}

export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null)
  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)

  // Wrapper de setProfile que también persiste en cache
  const setProfileCached = useCallback((p) => {
    setProfile(p)
    if (p) saveCachedProfile(p)
  }, [])

  // Sincroniza el perfil desde la red, con reintentos. NO borra el perfil
  // cacheado si falla — así nunca mandamos al usuario a ProfileSetup por error.
  const syncProfile = useCallback(async (uid, retries = 3) => {
    if (!uid) return
    for (let i = 0; i < retries; i++) {
      try {
        const p = await getProfile(uid)
        if (p) {
          setProfile(p)
          saveCachedProfile(p)
          setError('')
          return p
        }
        // Si la red responde pero no hay perfil, el usuario es nuevo de verdad
        return null
      } catch (e) {
        if (i === retries - 1) {
          console.warn('syncProfile falló:', e.message)
          // NO seteamos profile a null — mantenemos el cache si existe
        } else {
          await new Promise(r => setTimeout(r, 500 * (i + 1)))
        }
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    if (data?.user?.id) await syncProfile(data.user.id)
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
        // 1. Mostrar perfil cacheado AL INSTANTE (si existe) → cero parpadeo
        const cached = loadCachedProfile(sess.user.id)
        if (cached && mounted) setProfile(cached)

        // 2. Refrescar desde la red en segundo plano (con reintentos)
        Promise.all([
          syncProfile(sess.user.id),
          checkMFA(sess),
        ]).then(([prof]) => {
          if (mounted && (prof || cached)) preloadFeed(sess.user.id)
        }).catch(e => console.warn('Init:', e.message))
      }
    }).catch((e) => {
      clearTimeout(safetyTimer)
      if (mounted) { setError(e.message); setLoading(false) }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, ns) => {
      if (!mounted) return

      if (event === 'TOKEN_REFRESHED') {
        setSession(ns)
        return
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        clearCachedProfile()
        setMfaRequired(false)
        return
      }

      setSession(ns)
      if (ns?.user) {
        // Mostrar cache primero, refrescar después
        const cached = loadCachedProfile(ns.user.id)
        if (cached) setProfile(cached)
        await Promise.all([checkMFA(ns), syncProfile(ns.user.id)])
      } else {
        setProfile(null)
        clearCachedProfile()
      }
      if (mounted) setLoading(false)
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [syncProfile, checkMFA])

  // Al volver a la pestaña tras inactividad, verificar que la sesión siga viva.
  // Si el token expiró mientras la app estaba en background (común en móvil),
  // Supabase lo renueva aquí — evitando que las queries fallen con 401.
  useEffect(() => {
    if (!hasSupabaseEnv) return
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const { data, error: se } = await supabase.auth.getSession()
        if (se) return
        // Si la sesión sigue válida pero el perfil se perdió, recargarlo
        if (data.session?.user && !profile) {
          syncProfile(data.session.user.id)
        }
      } catch {}
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [profile, syncProfile])

  return (
    <AuthCtx.Provider value={{ session, profile, setProfile: setProfileCached, refreshProfile, loading, error, mfaRequired, setMfaRequired }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
