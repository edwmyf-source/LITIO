import { Bell, Search, Plus, Pencil, LayoutList, MessageSquare, Calculator, FlaskConical, User, HelpCircle, Lock, LogOut, ChevronDown } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { signOut } from '../../api/auth'
import { publicName } from '../../lib/helpers'
import { isAdmin } from '../../lib/constants'

export default function Topbar({ profile, unreadCount = 0, session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const name = publicName(profile)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const currentTab = '/' + (location.pathname.split('/')[1] || 'feed')

  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [menuOpen])

  const navItems = [
    { id: '/feed',          label: 'Feed',      Icon: LayoutList },
    { id: '/chats',         label: 'Inbox',     Icon: MessageSquare },
    { id: '/notifications', label: 'Alertas',   Icon: Bell, badge: unreadCount },
    { id: '/herramientas',  label: 'Herram.',   Icon: Calculator },
    { id: '/quimica',       label: '¿Sabes?',   Icon: FlaskConical },
  ]

  const menuItems = [
    { label: 'Mi perfil',     Icon: User,         path: session?.user?.id ? `/u/${session.user.id}` : '/profile' },
    { label: '¿Cuánto sabes?', Icon: FlaskConical, path: '/quimica' },
    { label: 'Soporte',       Icon: HelpCircle,    path: '/contact' },
    ...(isAdmin(profile, session?.user?.email) ? [{ label: 'Admin', Icon: Lock, path: '/admin' }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 w-full"
      style={{ background: '#ffffff', borderBottom: '1px solid #FFFFFF' }}>
      <div className="max-w-5xl mx-auto h-14 flex items-center gap-4 px-4">

        {/* Logo */}
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#111111' }}>
            <FlaskConical size={16} color="#8A8A8A" />
          </div>
          <span className="text-base font-bold hidden lg:block" style={{ color: '#111111', letterSpacing: '.5px' }}>CeQu.com</span>
        </button>

        {/* Buscador */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-xs"
          style={{ background: '#FFFFFF', border: '1px solid #D9D9D9' }}>
          <Search size={14} color="#8A8A8A" />
          <span className="text-xs" style={{ color: '#2A2A2A' }}>Buscar en CeQu...</span>
        </div>

        <div className="flex-1" />

        {/* Nav central */}
        <nav className="flex items-stretch h-14">
          {navItems.map(({ id, label, Icon, badge }) => {
            const active = currentTab === id
            return (
              <button key={id} onClick={() => navigate(id)}
                className="relative flex flex-col items-center justify-center gap-0.5 px-4 transition-colors border-b-2 hover:bg-gray-50"
                style={{ borderBottomColor: active ? '#111111' : 'transparent', minWidth: 56 }}>
                <div className="relative">
                  <Icon size={18} color={active ? '#111111' : '#8A8A8A'} />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center leading-tight">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color: active ? '#111111' : '#8A8A8A' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="w-px h-7 flex-shrink-0" style={{ background: '#D9D9D9' }} />

        {/* Avatar + dropdown */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button onClick={() => setMenuOpen(o => !o)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors hover:bg-gray-50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#111111' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-7 h-7 rounded-full object-cover" alt={name} />
                : initials}
            </div>
            <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: '#2A2A2A' }}>
              Yo <ChevronDown size={10} />
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
              style={{ background: '#fff', border: '1px solid #D9D9D9', boxShadow: '0 8px 32px rgba(13,27,62,0.18)', minWidth: 200 }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#EBEBEB' }}>
                <p className="text-sm font-bold" style={{ color: '#111111' }}>{name}</p>
                <p className="text-xs" style={{ color: '#2A2A2A' }}>{session?.user?.email}</p>
              </div>
              {menuItems.map(({ label, Icon, path }) => (
                <button key={path} onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-blue-50"
                  style={{ color: '#111111' }}>
                  <Icon size={15} style={{ color: '#111111' }} />
                  {label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #EBEBEB' }}>
                <button onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50"
                  style={{ color: '#dc2626' }}>
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botón publicar */}
        <button onClick={() => navigate('/feed')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 hover:bg-blue-50"
          style={{ background: '#fff', border: '1.5px solid #111111', color: '#111111' }}>
          <Pencil size={13} />
          Publicar
        </button>

      </div>
    </header>
  )
}
