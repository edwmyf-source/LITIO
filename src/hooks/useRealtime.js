import { useEffect, useRef } from 'react'
import { supabase } from '../api/supabase'

// ─── CANALES COMPARTIDOS CON RECONEXIÓN + FILTRO SERVER-SIDE ─────────────────
// Un solo canal por (tabla + evento + filtro), compartido entre componentes.
//
// ESCALABILIDAD: el parámetro `filter` hace que Supabase envíe SOLO las filas
// que coinciden (ej: filter='user_id=eq.UUID' para notificaciones). Sin esto,
// con 300 usuarios cada cliente recibiría TODOS los eventos de la tabla.
//
// RESILIENCIA:
// 1. Si el canal falla (CHANNEL_ERROR / TIMED_OUT), se reconecta solo.
// 2. Al volver a la pestaña o recuperar red, se re-suscriben todos los canales.
// 3. Cada callback va en su propio try/catch — uno que falle no rompe los demás.

const registry = new Map() // key -> { channel, listeners:Set, table, event, filter }

function subscribeChannel(entry) {
  const { table, event, filter } = entry
  const changeConfig = { event, schema: 'public', table }
  if (filter) changeConfig.filter = filter

  const channel = supabase
    .channel(`rt-${table}:${event}:${filter || 'all'}-${Date.now()}`)
    .on('postgres_changes', changeConfig, (payload) => {
      entry.listeners.forEach(fn => { try { fn(payload) } catch {} })
    })
    .subscribe((status) => {
      if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED')
          && entry.listeners.size > 0 && !entry.reconnecting) {
        entry.reconnecting = true
        setTimeout(() => {
          if (entry.listeners.size === 0) { entry.reconnecting = false; return }
          try { supabase.removeChannel(entry.channel) } catch {}
          entry.channel = subscribeChannel(entry)
          entry.reconnecting = false
        }, 2000)
      }
    })
  return channel
}

function getOrCreateChannel(table, event, filter) {
  const key = `${table}:${event}:${filter || 'all'}`
  let entry = registry.get(key)
  if (entry) return entry

  entry = { channel: null, listeners: new Set(), table, event, filter, reconnecting: false }
  entry.channel = subscribeChannel(entry)
  registry.set(key, entry)
  return entry
}

let globalListenersAttached = false
function attachGlobalListeners() {
  if (globalListenersAttached || typeof window === 'undefined') return
  globalListenersAttached = true

  const resubscribeAll = () => {
    for (const entry of registry.values()) {
      if (entry.listeners.size === 0) continue
      try { supabase.removeChannel(entry.channel) } catch {}
      entry.channel = subscribeChannel(entry)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resubscribeAll()
  })
  window.addEventListener('online', resubscribeAll)
}

// useRealtime(table, event, callback, filter?)
// filter: string opcional con sintaxis de Supabase, ej: `user_id=eq.${uid}`
export function useRealtime(table, event, callback, filter = null) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!supabase) return
    attachGlobalListeners()

    const key = `${table}:${event}:${filter || 'all'}`
    const entry = getOrCreateChannel(table, event, filter)
    const listener = (payload) => cbRef.current?.(payload)
    entry.listeners.add(listener)

    return () => {
      entry.listeners.delete(listener)
      if (entry.listeners.size === 0) {
        try { supabase.removeChannel(entry.channel) } catch {}
        registry.delete(key)
      }
    }
  }, [table, event, filter])
}
