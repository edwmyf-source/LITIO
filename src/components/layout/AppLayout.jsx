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
    { label: 'Mi perfil', icon: User, path: myId ? `/u/${myId}` : '/profile' },
    { label: '¿Cuánto sabes?', icon: FlaskConical, path: '/quimica' },
    { label: 'Soporte', icon: HelpCircle, path: '/contact' },
    ...(isAdmin(profile, session?.user?.email) ? [{ label: 'Admin', icon: Lock, path: '/admin' }] : []),
  ]

  const mobileNavItems = [
    { id: '/herramientas', label: 'Herram.', icon: Calculator },
    { id: '/feed',         label: 'Feed',    icon: LayoutList },
    { id: '/chats',        label: 'Mensajes', icon: MessageSquare },
    { id: '/notifications',label: 'Alertas',  icon: Bell, badge: unreadCount },
  ]

  return (
    <div className="min-h-screen" style={{ minHeight: '100vh', background: '#F2F7FF' }}>

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
        style={{ background: '#001A3D', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>

        {profileMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full right-2 mb-2 rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '0.5px solid #F2F7FF', boxShadow: '0 8px 32px rgba(13,27,62,0.18)', minWidth: 200 }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#F2F7FF' }}>
              <p className="text-sm font-semibold" style={{ color: '#001A3D' }}>{name}</p>
              <p className="text-xs" style={{ color: '#7EB6FF' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                  style={{ color: '#001A3D' }}>
                  <Icon size={16} style={{ color: '#2F80ED' }} />
                  {item.label}
                  <ChevronRight size={14} className="ml-auto" style={{ color: '#A7D8FF' }} />
                </button>
              )
            })}
            <div style={{ borderTop: '0.5px solid #F2F7FF' }}>
              <button onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-50"
                style={{ color: '#dc2626' }}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end px-2 pb-3 pt-1">
          {mobileNavItems.slice(0, 2).map(item => {
            const Icon = item.icon
            const active = currentTab === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className="flex-1 flex flex-col items-center gap-1 pt-1" aria-label={item.label}>
                <Icon size={24} style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.38)' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: active ? '#7EB6FF' : 'transparent' }} />
              </button>
            )
          })}
          <button onClick={() => navigate('/feed?publish=1')} aria-label="Nueva publicación"
            className="flex-1 flex justify-center items-end pb-1">
            <span className="w-[58px] h-[58px] rounded-full flex items-center justify-center -mb-1 active:scale-95 transition-all"
              style={{ background: '#2F80ED', boxShadow: '0 6px 20px rgba(47,128,237,0.5)', border: '3px solid rgba(255,255,255,0.15)' }}>
              <Plus size={28} color="#fff" strokeWidth={2.5} />
            </span>
          </button>
          {mobileNavItems.slice(2).map(item => {
            const Icon = item.icon
            const active = currentTab === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className="flex-1 flex flex-col items-center gap-1 pt-1 relative" aria-label={item.label}>
                <div className="relative">
                  <Icon size={24} style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.38)' }} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <div className="w-1 h-1 rounded-full" style={{ background: active ? '#7EB6FF' : 'transparent' }} />
              </button>
            )
          })}
          <button onClick={() => setProfileMenuOpen(o => !o)}
            className="flex-1 flex flex-col items-center gap-1 pt-1" aria-label="Menú perfil">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: profileMenuOpen ? '#001A3D' : '#2F80ED', boxShadow: profileMenuOpen ? '0 0 0 2px #7EB6FF' : 'none' }}>
              {initials}
            </div>
            <div className="w-1 h-1 rounded-full" style={{ background: 'transparent' }} />
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
