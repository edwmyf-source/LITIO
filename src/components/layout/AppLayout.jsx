import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutList, MessageSquare, Bell, Calculator, Plus, LogOut, User, HelpCircle, Lock, ChevronRight, FlaskConical, Home, Users, Search } from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const profileBtnRef = useRef(null)

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
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          profileBtnRef.current && !profileBtnRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [profileMenuOpen])

  useEffect(() => { setProfileMenuOpen(false) }, [location.pathname])

  const profileMenuItems = [
    { label: 'Mensajes', icon: MessageSquare, path: '/chats' },
    { label: 'Contactos', icon: Users, path: '/contacts' },
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
        style={{ background: '#ffffff', borderBottom: '1px solid #F5F8FD' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: '#0047AB' }}>
          <span className="text-white font-bold leading-none" style={{ fontSize: 12 }}>Co</span>
        </div>
        <span className="font-extrabold text-[15px]" style={{ color: '#0047AB' }}>Cobalto</span>
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
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FBE5E5' }}>
                    <Icon size={18} style={{ color: '#0047AB' }} />
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

        <div className="mx-4 mb-4 h-[72px] rounded-[28px] flex items-center justify-around px-2"
          style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 12px 40px rgba(17,24,39,0.14)', border: '1px solid rgba(255,255,255,0.6)', pointerEvents: 'auto' }}>

          {/* Feed */}
          {(() => { const active = currentTab === '/feed'; return (
            <button onClick={() => navigate('/feed')}
              className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform" aria-label="Feed">
              <Home size={22} style={{ color: active ? '#0047AB' : '#6B7280' }} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-semibold" style={{ color: active ? '#0047AB' : '#6B7280' }}>Feed</span>
            </button>
          )})()}

          {/* Mensajes */}
          {(() => { const active = currentTab === '/chats'; return (
            <button onClick={() => navigate('/chats')}
              className="flex flex-col items-center gap-1 flex-1 relative active:scale-95 transition-transform" aria-label="Mensajes">
              <div className="relative">
                <MessageSquare size={22} style={{ color: active ? '#0047AB' : '#6B7280' }} strokeWidth={active ? 2.4 : 2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: active ? '#0047AB' : '#6B7280' }}>Mensajes</span>
            </button>
          )})()}

          {/* Publicar — círculo primario */}
          <div className="flex-shrink-0 px-1">
            <button onClick={() => navigate('/feed?publish=1')} aria-label="Publicar"
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: '#0047AB', boxShadow: '0 10px 24px rgba(0,71,171,0.38)' }}>
              <Plus size={28} color="#ffffff" strokeWidth={2.5} />
            </button>
          </div>

          {/* Buscar */}
          {(() => { const active = currentTab === '/feed' && searchParams.get('buscar') === '1'; return (
            <button onClick={() => navigate('/feed?buscar=1')}
              className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform" aria-label="Buscar">
              <Search size={22} style={{ color: active ? '#0047AB' : '#6B7280' }} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-semibold" style={{ color: active ? '#0047AB' : '#6B7280' }}>Buscar</span>
            </button>
          )})()}

          {/* Perfil */}
          <button ref={profileBtnRef} onClick={() => setProfileMenuOpen(o => !o)}
            className="flex flex-col items-center gap-1 flex-1 relative active:scale-95 transition-transform" aria-label="Perfil">
            <User size={22} style={{ color: profileMenuOpen ? '#0047AB' : '#6B7280' }} strokeWidth={profileMenuOpen ? 2.4 : 2} />
            <span className="text-[11px] font-semibold" style={{ color: profileMenuOpen ? '#0047AB' : '#6B7280' }}>Perfil</span>
          </button>

        </div>
      </div>

      {/* ── Contenido principal ── */}
      <main className="pt-12 md:pt-0 pb-24 md:pb-8" style={{ overflowX: 'clip' }}>
        <Outlet />
      </main>
    </div>
  )
}
