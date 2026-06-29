import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, MessageSquare, Heart, MessageCircle, Bell, AtSign } from 'lucide-react'
import { getNotifications, markAsRead, markAllRead } from '../api/notifications'
import { getOrCreateConversation } from '../api/messages'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'
import { publicName, timeAgo } from '../lib/helpers'
import UserAvatar from '../components/shared/UserAvatar'
import Spinner from '../components/shared/Spinner'

const ICONS = {
  reaction: Heart,
  comment: MessageCircle,
  message: MessageSquare,
  mention: AtSign,
}

export default function NotificationsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(null)

  useEffect(() => {
    let mounted = true
    getNotifications(session.user.id)
      .then(data => { if (mounted) setNotifs(data) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [session.user.id])

  const handleMarkAll = async () => {
    await markAllRead(session.user.id)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleRead = async (id) => {
    await markAsRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // Llevar al usuario al contenido relacionado, no solo marcar leído
  const handleOpen = async (n) => {
    if (opening) return
    handleRead(n.id)
    if (!n.post_id) return
    setOpening(n.id)
    try {
      if (n.type === 'message') {
        const conv = await getOrCreateConversation(session.user.id, n.from_user_id, n.post_id)
        navigate('/chats', { state: { convId: conv.id } })
      } else {
        navigate('/feed', { state: { scrollToPostId: n.post_id } })
      }
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setOpening(null)
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-base text-ink-900">Notificaciones</h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium">
            <Check size={14} /> Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size={20} className="text-brand-600" /></div>
      ) : notifs.length === 0 ? (
        <div className="bg-white border border-ink-300 rounded-2xl p-8 text-center">
          <p className="text-sm text-ink-500">No tienes notificaciones aún.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifs.map(n => {
            const fromProf = n.from_profile || {}
            const fromName = publicName(fromProf)
            return (
              <button key={n.id} onClick={() => handleOpen(n)} disabled={opening === n.id}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl transition-colors ${
                  n.read ? 'bg-white' : 'bg-brand-500/5 border border-brand-500/10'
                } hover:bg-slate-50`}>
                <UserAvatar seed={fromProf.id || fromName} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink-900">
                    <span className="font-medium">{fromName}</span>{' '}
                    <span className="text-ink-500">{n.content}</span>
                  </p>
                  <span className="text-[11px] text-ink-400">{timeAgo(n.created_at)}</span>
                </div>
                {(() => {
                  const Icon = ICONS[n.type] || Bell
                  return <Icon size={16} className="flex-shrink-0 text-ink-400" />
                })()}
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-2" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
