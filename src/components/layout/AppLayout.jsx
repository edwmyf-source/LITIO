import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutList, MessageSquare, Bell, User, HelpCircle, Lock, Plus } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../contexts/AuthContext'
import { isAdmin } from '../../lib/constants'
import { getUnreadCount } from '../../api/notifications'
import { useRealtime } from '../../hooks/useRealtime'

const titles = {
  '/feed': 'Feed', '/chats': 'Inbox', '/notifications': 'Notificaciones',
  '/profile': 'Mi perfil', '/contact': 'Soporte', '/admin': 'Administración',
}

export default function AppLayout() {
  const { session, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  const currentTab = '/' + (location.pathname.split('/')[1] || 'feed')
  const title = titles[currentTab] || 'Rodio'
  const lastFetchRef = useRef(0)

  const refreshUnread = useCallback(() => {
    const now = Date.now()
    if (now - lastFetchRef.current < 30_000) return
    lastFetchRef.current = now
    if (session?.user?.id) {
      getUnreadCount(session.user.id).then(setUnreadCount).catch(() => {})
    }
  }, [session?.user?.id])

  useEffect(() => { refreshUnread() }, [refreshUnread, location.pathname])
  useRealtime('notifications', 'INSERT', useCallback(() => { refreshUnread() }, [refreshUnread]))

  const myId = session?.user?.id
  const mobileNav = [
    { id: '/feed',          label: 'Feed',   icon: LayoutList },
    { id: '/chats',         label: 'Inbox',  icon: MessageSquare },
    { id: '/notifications', label: 'Notif.', icon: Bell, badge: unreadCount },
    { id: myId ? `/u/${myId}` : '/profile', label: 'Perfil', icon: User, match: '/u/' },
    { id: '/contact',       label: 'Soporte', icon: HelpCircle },
    ...(isAdmin(profile, session?.user?.email) ? [{ id: '/admin', label: 'Admin', icon: Lock }] : []),
  ]

  return (
    <div className="flex min-h-screen bg-ink-100">
      <div className="hidden md:block">
        <Sidebar currentPath={currentTab} navigate={navigate} profile={profile} unreadCount={unreadCount} />
      </div>

      {/* Nav móvil — iconos 26px sin texto, punto activo */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-300 flex items-end">
        {mobileNav.map((item, idx) => {
          const Icon = item.icon
          const active = item.match ? currentTab.startsWith(item.match) : currentTab === item.id
          const insertPlus = idx === Math.floor(mobileNav.length / 2)
          return (
            <Fragment key={item.id}>
              {insertPlus && (
                <button key="fab-plus" onClick={() => navigate('/feed?publish=1')}
                  aria-label="Nueva publicación"
                  className="flex-1 flex justify-center items-end pb-3">
                  <span className="w-[52px] h-[52px] rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-brand-600/30 border-4 border-white -mb-1">
                    <Plus size={26} className="text-white" strokeWidth={2.5} />
                  </span>
                </button>
              )}
              <button onClick={() => navigate(item.id)}
                className="flex-1 flex flex-col items-center justify-end pb-3 pt-2 relative gap-1"
                aria-label={item.label}>
                <div className="relative">
                  <Icon size={26} className={active ? 'text-brand-600' : 'text-ink-500'} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-4">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                {/* punto activo */}
                <div className="w-1 h-1 rounded-full" style={{ background: active ? '#7c3aed' : 'transparent' }} />
              </button>
            </Fragment>
          )
        })}
      </div>

      <div className="flex-1 min-w-0 w-0 md:ml-[220px] overflow-x-hidden">
        <Topbar title={title} profile={profile} unreadCount={unreadCount} />
        <main className="p-3 md:p-5 pb-24 md:pb-5 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
