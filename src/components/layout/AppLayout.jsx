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
    <div className="min-h-screen" style={{ minHeight: '100vh', background: '#F3F6F5' }}>

      {/* ── Topbar LinkedIn — visible solo en desktop ── */}
      <div className="hidden md:block">
        <Topbar profile={profile} unreadCount={unreadCount} session={session} />
      </div>

      {/* ── Sidebar — solo móvil ── */}
      <div className="hidden">
        {/* Sidebar oculto — mantenemos para compatibilidad */}
      </div>

      {/* ── Nav móvil ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl"
        style={{ background: '#134E4A', boxShadow: '0 -2px 12px rgba(19,78,74,0.15)' }}>

        {profileMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full right-2 mb-2 rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #C5D9D5', boxShadow: '0 8px 32px rgba(13,27,62,0.18)', minWidth: 200 }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#D6E6E3' }}>
              <p className="text-sm font-semibold" style={{ color: '#134E4A' }}>{name}</p>
              <p className="text-xs" style={{ color: '#1F6E68' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                  style={{ color: '#134E4A' }}>
                  <Icon size={16} style={{ color: '#134E4A' }} />
                  {item.label}
                  {!!item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center leading-5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <ChevronRight size={14} className="ml-auto" style={{ color: '#3D7570' }} />
                </button>
              )
            })}
            <div style={{ borderTop: '1px solid #D6E6E3' }}>
              <button onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-50"
                style={{ color: '#dc2626' }}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end justify-around px-2 pt-3 pb-3 relative">

          {/* Feed (izquierda del todo) */}
          {(() => { const item = { id:'/feed', label:'Feed' }; const active = currentTab === item.id; return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className="flex-1 flex flex-col items-center justify-center pt-1 pb-0.5" aria-label={item.label}>
              <span className="text-base font-semibold" style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.8)' }}>{item.label}</span>
            </button>
          )})()}

          {/* Botón + flotante */}
          <div className="flex-1 flex justify-center">
            <button onClick={() => navigate('/feed?publish=1')} aria-label="Nueva publicación"
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center -mt-5 active:scale-95 transition-all"
              style={{ background: '#D9A5AC', boxShadow: '0 4px 12px rgba(19,78,74,0.25)', border: '2px solid #134E4A' }}>
              <Plus size={24} color="#134E4A" strokeWidth={2.5} />
            </button>
          </div>

          {/* Perfil (derecha del todo) */}
          <button onClick={() => setProfileMenuOpen(o => !o)}
            className="flex-1 flex flex-col items-center justify-center pt-1 pb-0.5 relative" aria-label="Menú perfil">
            <div className="relative">
              <span className="text-base font-semibold" style={{ color: profileMenuOpen ? '#ffffff' : 'rgba(255,255,255,0.8)' }}>Perfil</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
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
