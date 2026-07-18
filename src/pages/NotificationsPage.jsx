import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Bell } from 'lucide-react'
import { getNotifications, markAsRead, markAllRead } from '../api/notifications'
import { getOrCreateConversation } from '../api/messages'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'
import { timeAgo, publicName } from '../lib/helpers'
import Spinner from '../components/shared/Spinner'

// Etiqueta humana según el tipo/title de la notificacion
const ACTION_LABEL = {
  reaction:    'reaccionó a tu publicación',
  like:        'reaccionó a tu publicación',
  comment:     'comentó en tu publicación',
  message:     'te envió un mensaje',
  follow:      'empezó a seguirte',
  mention:     'te mencionó',
}

const getActionLabel = (n) => {
  const t = (n.title || '').toLowerCase()
  return ACTION_LABEL[t] || ACTION_LABEL[n.type] || null
}

const getSenderName = (n) => {
  const p = n.from_profile
  if (!p) return null
  return publicName(p)
}

const getInitials = (name) =>
  (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

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
      .then(data => {
        if (!mounted) return
        // Filtramos notificaciones del sistema antiguo (sin from_user_id = sin interaccion social)
        const social = data.filter(n => n.from_user_id)
        setNotifs(social)
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [session.user.id])

  const handleMarkAll = async () => {
    await markAllRead(session.user.id)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleOpen = async (n) => {
    if (opening) return
    await markAsRead(n.id)
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    if (!n.post_id) return
    setOpening(n.id)
    try {
      if ((n.title || '').toLowerCase() === 'message') {
        const conv = await getOrCreateConversation(session.user.id, n.from_user_id, n.post_id)
        navigate('/chats', { state: { convId: conv.id } })
      } else {
        navigate('/feed', { state: { scrollToPostId: n.post_id } })
      }
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setOpening(null)
  }

  const unreadCount = notifs.filter(n => !n.read).length

  const groupLabel = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'HOY'
    if (diff === 1) return 'AYER'
    if (diff < 7) return 'ESTA SEMANA'
    return 'ANTES'
  }

  const groups = notifs.reduce((acc, n) => {
    const lbl = groupLabel(n.created_at)
    if (!acc[lbl]) acc[lbl] = []
    acc[lbl].push(n)
    return acc
  }, {})

  const ORDER = ['HOY', 'AYER', 'ESTA SEMANA', 'ANTES']

  return (
    <div className="page-enter max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-xl" style={{ color: '#134E4A' }}>Notificaciones</h2>
          {unreadCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#C97B84', color: '#134E4A' }}>
              {unreadCount} nuevas
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70"
            style={{ color: '#3D7570' }}>
            <Check size={14} /> Marcar leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size={20} /></div>
      ) : notifs.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid #D6E6E3' }}>
          <Bell size={32} className="mx-auto mb-3" style={{ color: '#C5D9D5' }} />
          <p className="text-sm font-medium" style={{ color: '#3D7570' }}>
            Aún no tienes notificaciones de interacciones.
          </p>
          <p className="text-xs mt-1" style={{ color: '#A8C4BF' }}>
            Cuando alguien reaccione, comente o te escriba, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div>
          {ORDER.filter(lbl => groups[lbl]?.length).map(lbl => (
            <div key={lbl}>
              <p className="text-[11px] font-bold tracking-widest pb-2 pt-3"
                style={{ color: '#A8C4BF' }}>{lbl}</p>

              <div className="flex flex-col gap-2">
                {groups[lbl].map(n => {
                  const isUnread   = !n.read
                  const senderName = getSenderName(n)
                  const action     = getActionLabel(n)
                  const snippet    = n.post_content || n.post?.content || ''

                  // Si no tenemos ni nombre ni accion reconocida, saltamos (son del sistema antiguo que pasaron el filtro)
                  if (!senderName && !action) return null

                  return (
                    <button key={n.id} onClick={() => handleOpen(n)}
                      disabled={opening === n.id}
                      className="w-full text-left rounded-2xl transition-opacity disabled:opacity-60 active:opacity-70 overflow-hidden"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #D6E6E3',
                        borderLeft: isUnread ? '4px solid #134E4A' : '1px solid #D6E6E3',
                      }}>

                      <div className="flex items-center gap-3 px-3 py-3">
                        {/* Avatar con iniciales */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                          style={{ background: isUnread ? '#134E4A' : '#E8F1EF', color: isUnread ? '#fff' : '#3D7570' }}>
                          {getInitials(senderName)}
                        </div>

                        {/* Nombre + accion + tiempo */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] leading-snug" style={{ color: '#134E4A' }}>
                            <span className="font-semibold">{senderName || 'Usuario'}</span>
                            {action && (
                              <span style={{ color: '#3D7570', fontWeight: 400 }}> {action}</span>
                            )}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: '#A8C4BF' }}>
                            {timeAgo(n.created_at)}
                          </div>
                        </div>

                        {/* Punto no leído naranja */}
                        {isUnread && (
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: '#C97B84', boxShadow: '0 0 8px rgba(255,183,3,0.65)' }} />
                        )}
                      </div>

                      {/* Snippet de la publicacion */}
                      {snippet && (
                        <div className="mx-3 mb-3 px-3 py-2 rounded-lg text-[12px] leading-relaxed"
                          style={{ background: '#F3F6F5', borderLeft: '3px solid #C5D9D5', color: '#3D7570' }}>
                          "{snippet.slice(0, 120)}{snippet.length > 120 ? '...' : ''}"
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
