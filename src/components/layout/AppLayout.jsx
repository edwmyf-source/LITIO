import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutList, MessageSquare, Bell, Calculator, Plus, LogOut, User, HelpCircle, Lock, ChevronRight, FlaskConical, Home } from 'lucide-react'
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
    <div className="min-h-screen" style={{ minHeight: '100vh', background: '#FFFFFF' }}>

      {/* ── Topbar LinkedIn — visible solo en desktop ── */}
      <div className="hidden md:block">
        <Topbar profile={profile} unreadCount={unreadCount} session={session} />
      </div>

      {/* ── Topbar móvil fija ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 px-4 h-12"
        style={{ background: '#ffffff', borderBottom: '1px solid #F3F3F3' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: '#111111' }}>
          <span className="text-white font-bold leading-none" style={{ fontSize: 12 }}>CQ</span>
        </div>
        <span className="font-extrabold text-[15px]" style={{ color: '#111111' }}>CeQu.com</span>
      </div>

      {/* ── Sidebar — solo móvil ── */}
      <div className="hidden">
        {/* Sidebar oculto — mantenemos para compatibilidad */}
      </div>

      {/* ── Nav móvil flotante (glass) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" style={{ pointerEvents: 'none' }}>

        {profileMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full right-4 mb-3 rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 16px 48px rgba(17,24,39,0.18)', minWidth: 230, pointerEvents: 'auto' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-[15px] font-bold" style={{ color: '#111827', letterSpacing: '-0.01em' }}>{name}</p>
              <p className="text-[13px]" style={{ color: '#6B7280' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 text-[15px] font-medium transition-colors hover:bg-gray-50"
                  style={{ color: '#111827' }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5E6E9' }}>
                    <Icon size={18} style={{ color: '#B06B76' }} />
                  </span>
                  {item.label}
                  {!!item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center leading-5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="ml-auto" style={{ color: '#9CA3AF' }} />
                </button>
              )
            })}
            <div style={{ borderTop: '1px solid #E5E7EB' }}>
              <button onClick={() => signOut()}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-[15px] font-medium transition-colors hover:bg-red-50"
                style={{ color: '#EF4444' }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
                  <LogOut size={18} />
                </span>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="mx-4 mb-6 h-[76px] rounded-[30px] flex items-center justify-around px-3"
          style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 12px 40px rgba(17,24,39,0.14)', border: '1px solid rgba(255,255,255,0.6)', pointerEvents: 'auto' }}>

          {/* Inicio */}
          {(() => { const active = currentTab === '/feed'; return (
            <button onClick={() => navigate('/feed')}
              className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform" aria-label="Inicio">
              <Home size={22} style={{ color: active ? '#0F5C57' : '#6B7280' }} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[12px] font-semibold" style={{ color: active ? '#0F5C57' : '#6B7280' }}>Inicio</span>
            </button>
          )})()}

          {/* Publicar — círculo primario */}
          <div className="flex-shrink-0 px-2">
            <button onClick={() => navigate('/feed?publish=1')} aria-label="Publicar"
              className="w-[58px] h-[58px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: '#0F5C57', boxShadow: '0 10px 24px rgba(15,92,87,0.38)' }}>
              <Plus size={28} color="#ffffff" strokeWidth={2.5} />
            </button>
          </div>

          {/* Perfil */}
          <button onClick={() => setProfileMenuOpen(o => !o)}
            className="flex flex-col items-center gap-1 flex-1 relative active:scale-95 transition-transform" aria-label="Perfil">
            <div className="relative">
              <User size={22} style={{ color: profileMenuOpen ? '#0F5C57' : '#6B7280' }} strokeWidth={profileMenuOpen ? 2.4 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[12px] font-semibold" style={{ color: profileMenuOpen ? '#0F5C57' : '#6B7280' }}>Perfil</span>
          </button>

        </div>
      </div>

      {/* ── Contenido principal ── */}
      <main className="pt-12 md:pt-0 pb-32 md:pb-8" style={{ overflowX: 'clip' }}>
        <Outlet />
      </main>
    </div>
  )
}
