import { useEffect, useState } from 'react'
import { LayoutList, MessageSquare, User, HelpCircle, Lock, LogOut, Plus, Bell, Calendar } from 'lucide-react'
import { signOut } from '../../api/auth'
import { isAdmin } from '../../lib/constants'
import { getUpcomingEvents } from '../../api/posts'
import { publicName } from '../../lib/helpers'
import { CATEGORY_MAP } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import LitioMark from '../shared/LitioMark'

// Cache de eventos próximos: se renueva cada 5 minutos
let _eventsCache = null
let _eventsTs = 0
const EVENTS_TTL = 5 * 60 * 1000

async function getUpcomingEventsCached() {
  if (_eventsCache && Date.now() - _eventsTs < EVENTS_TTL) return _eventsCache
  const data = await getUpcomingEvents()
  _eventsCache = data
  _eventsTs = Date.now()
  return data
}

// Formatea "2026-07-15" → "15 jul"
function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
}

function UpcomingEventsWidget({ navigate }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    getUpcomingEventsCached().then(setEvents).catch(() => {})
  }, [])

  if (events.length === 0) return null

  return (
    <div className="mx-3 mb-2 flex-shrink-0">
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
        <Calendar size={11} className="text-brand-400" />
        <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Próximos eventos</span>
      </div>
      <div className="space-y-1">
        {events.map(ev => (
          <button key={ev.id}
            onClick={() => navigate('/feed')}
            className="w-full text-left group flex items-center gap-2 px-1 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-[9px] font-bold text-brand-300 bg-brand-500/15 rounded px-1 py-0.5 flex-shrink-0 leading-tight whitespace-nowrap">
              {formatEventDate(ev.event_date)}
            </span>
            <span className="text-[10px] text-white/55 group-hover:text-white/90 leading-tight truncate transition-colors">
              {ev.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Sidebar({ currentPath, navigate, profile, unreadCount = 0 }) {
  const { session } = useAuth()
  const myId = session?.user?.id
  const navItems = [
    { path: '/feed',          label: 'Feed',           icon: LayoutList },
    { path: '/chats',         label: 'Inbox',          icon: MessageSquare },
    { path: '/notifications', label: 'Notificaciones', icon: Bell, badge: unreadCount },
    { path: myId ? `/u/${myId}` : '/profile', label: 'Mi perfil', icon: User, match: '/u/' },
    { path: '/contact',       label: 'Soporte',        icon: HelpCircle },
  ]
  if (isAdmin(profile, session?.user?.email)) navItems.push({ path: '/admin', label: 'Admin', icon: Lock })

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-gradient-to-b from-violet-950 via-[#1b1330] to-violet-950 shadow-2xl flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <LitioMark size={32} />
        <div>
          <span className="font-bold text-base text-white block leading-tight tracking-wide">LITIO</span>
          <span className="text-[10px] text-violet-300 leading-tight">Conexiones que reaccionan</span>
        </div>
      </div>

      {/* Botón publicar */}
      <div className="px-3 mt-4 mb-2 flex-shrink-0">
        <button onClick={() => navigate('/feed?publish=1')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-violet-600 hover:scale-[1.02] active:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-none">
          <Plus size={16} />
          Nueva publicación
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto min-h-0">
        {navItems.map(item => {
          const active = item.match ? currentPath.startsWith(item.match) : currentPath === item.path
          const Icon = item.icon
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-ink-300 hover:bg-white/5'
              }`}>
              <Icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Próximos eventos — widget compacto abajo */}
      <UpcomingEventsWidget navigate={navigate} />

      {/* Salir */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 flex-shrink-0">
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-ink-300 hover:bg-white/5 hover:text-white text-sm transition-colors">
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  )
}
