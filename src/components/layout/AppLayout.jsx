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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-[18px] h-14"
        style={{ background: 'radial-gradient(circle at 30% -40%, #1A5AC8 0%, #0B2E68 50%, #081F4A 100%)' }}>
        <span className="font-extrabold text-[21px]" style={{ color: '#ffffff', letterSpacing: '-0.03em' }}>
          Cobalto<span style={{ color: '#7FB2FF' }}>.</span>
        </span>
      </div>

      {/* ── Sidebar — solo móvil ── */}
      <div className="hidden">
        {/* Sidebar oculto — mantenemos para compatibilidad */}
      </div>

      {/* ── Nav móvil flotante (glass) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" style={{ pointerEvents: 'none' }}>

        {profileMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full right-4 mb-3 rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 16px 48px rgba(0,71,171,0.2)', minWidth: 230, pointerEvents: 'auto' }}>
            <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg,#EBF1FC,#F4F7FD)' }}>
              <p className="text-[15px] font-extrabold" style={{ color: '#0A2A5C', letterSpacing: '-0.01em' }}>{name}</p>
              <p className="text-[13px] font-medium" style={{ color: '#5578AD' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 text-[15px] font-bold transition-colors hover:bg-blue-50"
                  style={{ color: '#0A2A5C' }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EBF1FC' }}>
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

        <div className="mx-4 mb-4 h-[60px] rounded-[24px] flex items-center justify-around px-2"
          style={{ background: 'rgba(8,31,74,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 16px 40px rgba(8,31,74,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', pointerEvents: 'auto' }}>

          {/* Feed */}
          {(() => { const active = currentTab === '/feed'; return (
            <button onClick={() => navigate('/feed')}
              className="flex flex-col items-center gap-[3px] flex-1 active:scale-95 transition-transform" aria-label="Feed">
              <span className="text-[9px] font-extrabold" style={{ color: active ? '#7FB2FF' : '#5A6E94' }}>Feed</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7FB2FF', boxShadow: '0 0 8px rgba(127,178,255,0.9)' }} />}
            </button>
          )})()}

          {/* Mensajes */}
          {(() => { const active = currentTab === '/chats'; return (
            <button onClick={() => navigate('/chats')}
              className="flex flex-col items-center gap-[3px] flex-1 relative active:scale-95 transition-transform" aria-label="Mensajes">
              <div className="relative">
                <span className="text-[9px] font-extrabold" style={{ color: active ? '#7FB2FF' : '#5A6E94' }}>Mensajes</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7FB2FF', boxShadow: '0 0 8px rgba(127,178,255,0.9)' }} />}
            </button>
          )})()}

          {/* Publicar — círculo primario */}
          <div className="flex-shrink-0 px-1" style={{ marginTop: -22 }}>
            <button onClick={() => navigate('/feed?publish=1')} aria-label="Publicar"
              className="w-[46px] h-[46px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#1A5AC8,#4C82F0)',
                boxShadow: '0 8px 24px rgba(26,90,200,0.55), inset 0 1px 0 rgba(255,255,255,0.3)', border: '3px solid #E4EBF7' }}>
              <Plus size={24} color="#ffffff" strokeWidth={2.5} />
            </button>
          </div>

          {/* Buscar */}
          {(() => { const active = currentTab === '/feed' && searchParams.get('buscar') === '1'; return (
            <button onClick={() => navigate('/feed?buscar=1')}
              className="flex flex-col items-center gap-[3px] flex-1 active:scale-95 transition-transform" aria-label="Buscar">
              <span className="text-[9px] font-extrabold" style={{ color: active ? '#7FB2FF' : '#5A6E94' }}>Buscar</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7FB2FF', boxShadow: '0 0 8px rgba(127,178,255,0.9)' }} />}
            </button>
          )})()}

          {/* Personas */}
          {(() => { const active = currentTab === '/contacts'; return (
            <button onClick={() => navigate('/contacts')}
              className="flex flex-col items-center gap-[3px] flex-1 active:scale-95 transition-transform" aria-label="Personas">
              <span className="text-[9px] font-extrabold" style={{ color: active ? '#7FB2FF' : '#5A6E94' }}>Personas</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7FB2FF', boxShadow: '0 0 8px rgba(127,178,255,0.9)' }} />}
            </button>
          )})()}

          {/* Perfil */}
          <button ref={profileBtnRef} onClick={() => setProfileMenuOpen(o => !o)}
            className="flex flex-col items-center gap-[3px] flex-1 relative active:scale-95 transition-transform" aria-label="Perfil">
            <span className="text-[9px] font-extrabold" style={{ color: profileMenuOpen ? '#7FB2FF' : '#5A6E94' }}>Perfil</span>
            {profileMenuOpen && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7FB2FF', boxShadow: '0 0 8px rgba(127,178,255,0.9)' }} />}
          </button>

        </div>
      </div>

      {/* ── Contenido principal ── */}
      <main className="pt-14 md:pt-0 pb-24 md:pb-8" style={{ overflowX: 'clip' }}>
        <Outlet />
      </main>
    </div>
  )
}
