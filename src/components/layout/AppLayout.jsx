import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutList, MessageSquare, Bell, User, HelpCircle, Lock, Plus, Calculator, LogOut, ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../contexts/AuthContext'
import { isAdmin } from '../../lib/constants'
import { getUnreadCount } from '../../api/notifications'
import { useRealtime } from '../../hooks/useRealtime'
import { signOut } from '../../api/auth'
import { publicName } from '../../lib/helpers'

const titles = {
  '/feed': 'Feed', '/chats': 'Inbox', '/notifications': 'Notificaciones',
  '/profile': 'Mi perfil', '/contact': 'Soporte', '/admin': 'Administración',
  '/herramientas': 'Herramientas',
}

export default function AppLayout() {
  const { session, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const currentTab = '/' + (location.pathname.split('/')[1] || 'feed')
  const title = titles[currentTab] || 'Rodio'
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

  // Cerrar menú al tocar fuera
  useEffect(() => {
    if (!profileMenuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setProfileMenuOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [profileMenuOpen])

  // Cerrar menú al cambiar de ruta
  useEffect(() => { setProfileMenuOpen(false) }, [location.pathname])

  const profileMenuItems = [
    { label: 'Mi perfil', icon: User, path: myId ? `/u/${myId}` : '/profile' },
    { label: 'Soporte', icon: HelpCircle, path: '/contact' },
    ...(isAdmin(profile, session?.user?.email) ? [{ label: 'Admin', icon: Lock, path: '/admin' }] : []),
  ]

  // 5 botones fijos en la barra
  const navItems = [
    { id: '/herramientas', label: 'Herram.', icon: Calculator },
    { id: '/feed',         label: 'Feed',    icon: LayoutList },
    // centro = FAB publicar
    { id: '/chats',        label: 'Mensajes', icon: MessageSquare, badge: null },
    { id: '/notifications',label: 'Alertas',  icon: Bell, badge: unreadCount },
  ]

  return (
    <div className="flex min-h-screen" style={{ minHeight: '100vh' }}>
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar currentPath={currentTab} navigate={navigate} profile={profile} unreadCount={unreadCount} />
      </div>

      {/* ── Nav móvil ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(147,197,253,0.4)' }}>

        {/* Menú perfil — se despliega hacia arriba desde la esquina derecha */}
        {profileMenuOpen && (
          <div ref={menuRef} className="absolute bottom-full right-2 mb-2 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', border: '0.5px solid rgba(147,197,253,0.5)', boxShadow: '0 8px 32px rgba(37,99,235,0.15)', minWidth: 180 }}>
            {/* Cabecera */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(147,197,253,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>{name}</p>
              <p className="text-xs" style={{ color: '#93c5fd' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                  style={{ color: '#1e3a5f' }}>
                  <Icon size={16} style={{ color: '#2563eb' }} />
                  {item.label}
                  <ChevronRight size={14} className="ml-auto" style={{ color: '#93c5fd' }} />
                </button>
              )
            })}
            <div style={{ borderTop: '0.5px solid rgba(147,197,253,0.3)' }}>
              <button onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-50"
                style={{ color: '#dc2626' }}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Barra de 5 botones */}
        <div className="flex items-end px-2 pb-3 pt-1">
          {/* Izq: herramientas + feed */}
          {navItems.slice(0, 2).map(item => {
            const Icon = item.icon
            const active = currentTab === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className="flex-1 flex flex-col items-center gap-1 pt-1"
                aria-label={item.label}>
                <Icon size={24} style={{ color: active ? '#2563eb' : '#93c5fd' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: active ? '#2563eb' : 'transparent' }} />
              </button>
            )
          })}

          {/* Centro: FAB publicar */}
          <button onClick={() => navigate('/feed?publish=1')} aria-label="Nueva publicación"
            className="flex-1 flex justify-center items-end pb-1">
            <span className="w-[58px] h-[58px] rounded-full flex items-center justify-center -mb-1 active:scale-95 transition-all"
              style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.45)', border: '3px solid rgba(255,255,255,0.9)' }}>
              <Plus size={28} color="#fff" strokeWidth={2.5} />
            </span>
          </button>

          {/* Der: mensajes + alertas */}
          {navItems.slice(2).map(item => {
            const Icon = item.icon
            const active = currentTab === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className="flex-1 flex flex-col items-center gap-1 pt-1 relative"
                aria-label={item.label}>
                <div className="relative">
                  <Icon size={24} style={{ color: active ? '#2563eb' : '#93c5fd' }} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <div className="w-1 h-1 rounded-full" style={{ background: active ? '#2563eb' : 'transparent' }} />
              </button>
            )
          })}

          {/* Perfil — abre menú */}
          <button onClick={() => setProfileMenuOpen(o => !o)}
            className="flex-1 flex flex-col items-center gap-1 pt-1"
            aria-label="Perfil y más opciones">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
              style={{ background: profileMenuOpen ? '#1d4ed8' : '#2563eb', boxShadow: profileMenuOpen ? '0 0 0 2px #93c5fd' : 'none' }}>
              {initials}
            </div>
            <div className="w-1 h-1 rounded-full" style={{ background: [myId ? `/u/${myId}` : '/profile', '/contact', '/admin'].some(p => currentTab === p) ? '#2563eb' : 'transparent' }} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 w-0 md:ml-[220px] overflow-x-hidden">
        <Topbar title={title} profile={profile} unreadCount={unreadCount} />
        <main className="p-3 md:p-5 pb-28 md:pb-5 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
