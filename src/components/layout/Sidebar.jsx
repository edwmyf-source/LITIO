import { useEffect, useState } from 'react'
import { LayoutList, MessageSquare, User, HelpCircle, Lock, LogOut, Plus, Bell, Calendar, Wrench, FlaskConical } from 'lucide-react'
import { signOut } from '../../api/auth'
import { isAdmin } from '../../lib/constants'
import { getUpcomingEvents } from '../../api/posts'
import { publicName } from '../../lib/helpers'
import { CATEGORY_MAP } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import RodioMark from '../shared/RodioMark'

let _eventsCache = null
let _eventsTs = 0
const EVENTS_TTL = 5 * 60 * 1000

async function getUpcomingEventsCached() {
  if (_eventsCache && Date.now() - _eventsTs < EVENTS_TTL) return _eventsCache
  const data = await getUpcomingEvents()
  _eventsCache = data; _eventsTs = Date.now()
  return data
}

export default function Sidebar({ currentPath, navigate, profile, unreadCount = 0 }) {
  const { session } = useAuth()
  const myId = session?.user?.id
  const name = publicName(profile)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => {
    getUpcomingEventsCached().then(setUpcomingEvents).catch(() => {})
  }, [])

  const navItems = [
    { path: '/feed',          label: 'Feed',           icon: LayoutList },
    { path: '/chats',         label: 'Inbox',          icon: MessageSquare },
    { path: '/notifications', label: 'Notificaciones', icon: Bell, badge: unreadCount },
    { path: myId ? `/u/${myId}` : '/profile', label: 'Mi perfil', icon: User, match: '/u/' },
    { path: '/herramientas',  label: 'Herramientas',   icon: Wrench },
    { path: '/quimica',       label: '¿Cuánto sabes?', icon: FlaskConical },
    { path: '/contact',       label: 'Soporte',        icon: HelpCircle },
  ]
  if (isAdmin(profile, session?.user?.email)) navItems.push({ path: '/admin', label: 'Admin', icon: Lock })

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-40"
      style={{ background: 'rgba(30,64,175,0.88)', backdropFilter: 'blur(20px)', borderRight: '0.5px solid rgba(255,255,255,0.15)' }}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-2">
        <RodioMark size={28} />
        <span className="text-white font-bold text-lg tracking-tight">Rodio</span>
      </div>

      {/* Publicar */}
      <div className="px-3 mb-4">
        <button onClick={() => navigate('/feed?publish=1')}
          className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#2563eb', border: '0.5px solid rgba(255,255,255,0.25)' }}>
          <Plus size={16} /> Nueva publicación
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = item.match ? currentPath.startsWith(item.match) : currentPath === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm transition-all"
              style={active
                ? { background: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600 }
                : { color: 'rgba(255,255,255,0.60)' }}>
              <div className="relative">
                <Icon size={18} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Próximos eventos */}
      {upcomingEvents.length > 0 && (
        <div className="mx-3 mb-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.10)', border: '0.5px solid rgba(255,255,255,0.15)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar size={12} style={{ color: '#93c5fd' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#93c5fd' }}>Próximos eventos</span>
          </div>
          {upcomingEvents.slice(0, 2).map(ev => (
            <div key={ev.id} className="text-[11px] leading-tight mb-1" style={{ color: 'rgba(255,255,255,0.70)' }}>
              <span className="font-medium" style={{ color: '#fff' }}>{ev.title?.slice(0, 28)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer usuario */}
      <div className="px-3 pb-5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: '#2563eb', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
            {initials}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{name}</span>
        </div>
        <button onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
