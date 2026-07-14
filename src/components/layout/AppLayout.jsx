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
    { id: '/feed',          label: 'Feed',     icon: LayoutList },
    { id: '/chats',         label: 'Mensajes', icon: MessageSquare },
    { id: '/notifications', label: 'Alertas',  icon: Bell, badge: unreadCount },
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
            style={{ background: '#fff', border: '1px solid #CDDBEC', boxShadow: '0 8px 32px rgba(13,27,62,0.18)', minWidth: 200 }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#DDE7F4' }}>
              <p className="text-sm font-semibold" style={{ color: '#001A3D' }}>{name}</p>
              <p className="text-xs" style={{ color: '#3A6FAE' }}>{session?.user?.email}</p>
            </div>
            {profileMenuItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-blue-50"
                  style={{ color: '#001A3D' }}>
                  <Icon size={16} style={{ color: '#001A3D' }} />
                  {item.label}
                  <ChevronRight size={14} className="ml-auto" style={{ color: '#5D8BC7' }} />
                </button>
              )
            })}
            <div style={{ borderTop: '1px solid #DDE7F4' }}>
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

          {/* Mensajes */}
          {(() => { const item = { id:'/chats', label:'Mensajes', icon: MessageSquare }; const Icon = item.icon; const active = currentTab === item.id; return (
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
              style={{ background: '#FFB703', boxShadow: '0 8px 24px rgba(255,183,3,0.5), 0 2px 4px rgba(0,0,0,0.15)', border: '4px solid #001A3D' }}>
              <Plus size={34} color="#001A3D" strokeWidth={3} />
            </button>
          </div>

          {/* Alertas */}
          {(() => { const item = { id:'/notifications', label:'Alertas', icon: Bell, badge: unreadCount }; const Icon = item.icon; const active = currentTab === item.id; return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 pt-1 pb-0.5 relative" aria-label={item.label}>
              <div className="relative">
                <Icon size={22} style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.5)' }} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold" style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>{item.label}</span>
            </button>
          )})()}

          {/* Perfil (derecha del todo) */}
          <button onClick={() => setProfileMenuOpen(o => !o)}
            className="flex-1 flex flex-col items-center gap-0.5 pt-1 pb-0.5" aria-label="Menú perfil">
            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: profileMenuOpen ? '#7EB6FF' : 'rgba(255,255,255,0.15)', color: profileMenuOpen ? '#001A3D' : '#ffffff', boxShadow: profileMenuOpen ? '0 0 0 2px #7EB6FF' : 'none' }}>
              {initials}
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
