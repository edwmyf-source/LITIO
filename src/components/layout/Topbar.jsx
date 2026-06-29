import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ title, profile, unreadCount = 0 }) {
  const navigate = useNavigate()
  const initials = (profile?.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      {/* key=title re-monta el h1 en cada cambio de página → dispara slide-in-left */}
      <h1 key={title} className="slide-in-left font-bold text-base text-ink-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/notifications')} aria-label="Notificaciones"
          className="relative p-1.5 rounded-2xl hover:bg-slate-50 text-ink-500">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-danger-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <span className="text-sm text-ink-900 hidden sm:block">{profile?.full_name}</span>
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  )
}
