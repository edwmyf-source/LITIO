import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutList, MessageSquare, Bell, Calculator, Plus, LogOut, User, HelpCircle, Lock, ChevronRight, FlaskConical } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../contexts/AuthContext'
import { isAdmin } from '../../lib/constants'
import { getUnreadCount } from '../../api/notifications'
import { useRealtime } from '../../hooks/useRealtime'
import { signOut } from '../../api/auth'
import { publicName } from '../../lib/helpers'

export default function AppLayout() {
  const { session, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const currentTab = '/' + (location.pathname.split('/')[1] || 'feed')
  const lastFetchRef = useRef(0)
  const myId = session?.user?.id
  const name = publicName(profile)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const refreshUnread = useCallback(() => {
    const now = Date.now()
    if (now - lastFetchRef.current < 30_000) return
    lastFetchRef.current = now
    if (session?.user?.id) {
      getUnreadCount(session.user.id).then(setUnreadCount).catch(() => {})
    }
  }, [session?.user?.id])

  useEffect(() => { refreshUnread() }, [refreshUnread, location.pathname])

  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500))
    const id = idle(() => {
      import('../../pages/ChatsPage')
      import('../../pages/NotificationsPage')
      import('../../pages/UserProfilePage')
      import('../../pages/ProfilePage')
    })
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])

  useRealtime('notifications', 'INSERT', useCallback(() => { refreshUnread() }, [refreshUnread]),
    session?.user?.id ? `user_id=eq.${session.user.id}` : null)

  useEffect(() => {
    if (!profileMenuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setProfileMenuOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [profileMenuOpen])

  useEffect(() => { setProfileMenuOpen(false) }, [location.pathname])

  const profileMenuItems = [
    { label: 'Mensajes', icon: MessageSquare, path: '/chats' },
    { label: 'Alertas',  icon: Bell,          path: '/notifications', badge: unreadCount },
    { label: 'Mi perfil', icon: User, path: myId ? `/u/${myId}` : '/profile' },
    { label: '¿Cuánto sabes?', icon: FlaskConical, path: '/quimica' },
    { label: 'Soporte', icon: HelpCircle, path: '/contact' },
    ...(isAdmin(profile, session?.user?.email) ? [{ label: 'Admin', icon: Lock, path: '/admin' }] : []),
  ]

  const mobileNavItems = [
    { id: '/feed',          label: 'Feed',     icon: LayoutList },
    { id: '/chats',         label: 'Mensajes', icon: MessageSquare },
    { id: '/notifications', label: 'Alertas',  icon: Bell, badge: unreadCount },
  ]

  return (
    <div className="min-h-screen" style={{ minHeight: '100vh', background: '#FAF7F5' }}>

      {/* ── Topbar LinkedIn — visible solo en desktop ── */}
      <div className="hidden md:block">
        <Topbar profile={profile} unreadCount={unreadCount} session={session} />
      </div>

      {/* ── Sidebar — solo móvil ── */}
      <div className="hidden">
        {/* Sidebar oculto — mantenemos para compatibilidad */}
      </div>

      {/* ── Nav móvil ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ background: '#5C1A2E', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>

        {profileMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full right-2 mb-2 rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #E0CFD3', boxShadow: '0 8px 32px rgba(13,27,62,0.18)', minWidth: 200 }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#EEE3E5' }}>
              <p className="text-sm font-semibold" style={{ color: '#5C1A2E' }}>{name}</p>
              <p className="text-xs" style={{ color: '#2F5233' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                  style={{ color: '#5C1A2E' }}>
                  <Icon size={16} style={{ color: '#5C1A2E' }} />
                  {item.label}
                  {!!item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center leading-5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <ChevronRight size={14} className="ml-auto" style={{ color: '#B09499' }} />
                </button>
              )
            })}
            <div style={{ borderTop: '1px solid #EEE3E5' }}>
              <button onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-50"
                style={{ color: '#dc2626' }}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end justify-around px-2 pt-2 pb-2 relative">

          {/* Feed (izquierda del todo) */}
          {(() => { const item = { id:'/feed', label:'Feed', icon: LayoutList }; const Icon = item.icon; const active = currentTab === item.id; return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 pt-1 pb-0.5" aria-label={item.label}>
              <Icon size={22} style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.5)' }} />
              <span className="text-[9px] font-semibold" style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>{item.label}</span>
            </button>
          )})()}

          {/* Botón + flotante */}
          <div className="flex-1 flex justify-center">
            <button onClick={() => navigate('/feed?publish=1')} aria-label="Nueva publicación"
              className="w-[68px] h-[68px] rounded-full flex items-center justify-center -mt-8 active:scale-95 transition-all"
              style={{ background: '#D9A5AC', boxShadow: '0 8px 24px rgba(217,165,172,0.5), 0 2px 4px rgba(0,0,0,0.15)', border: '4px solid #5C1A2E' }}>
              <Plus size={34} color="#5C1A2E" strokeWidth={3} />
            </button>
          </div>

          {/* Perfil (derecha del todo) */}
          <button onClick={() => setProfileMenuOpen(o => !o)}
            className="flex-1 flex flex-col items-center gap-0.5 pt-1 pb-0.5 relative" aria-label="Menú perfil">
            <div className="relative">
              <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: profileMenuOpen ? '#8FAE8B' : 'rgba(255,255,255,0.15)', color: profileMenuOpen ? '#5C1A2E' : '#ffffff', boxShadow: profileMenuOpen ? '0 0 0 2px #8FAE8B' : 'none' }}>
                {initials}
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-semibold" style={{ color: profileMenuOpen ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>Perfil</span>
          </button>

        </div>
      </div>

      {/* ── Contenido principal ── */}
      <main className="md:pt-0 pb-28 md:pb-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
