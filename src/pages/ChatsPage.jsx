import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Send, Search, MessageSquareText } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getConversations, getMessages, sendMessage } from '../api/messages'
import { createNotification } from '../api/notifications'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../hooks/useRealtime'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'
import { publicName, timeAgo } from '../lib/helpers'
import { CATEGORY_MAP } from '../lib/constants'
import UserAvatar from '../components/shared/UserAvatar'
import Spinner from '../components/shared/Spinner'

/* ─── Bandeja estilo B1 (WhatsApp) ─── */
function ConversationList({ conversations, activeId, onSelect, userId }) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(conv => {
    const other = conv.user1_id === userId ? conv.user2 : conv.user1
    const name = publicName(other || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col h-full" style={{ background: '#ffffff' }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #FFFFFF' }}>
        <h2 className="text-[22px] font-bold" style={{ color: '#0047AB' }}>Mensajes</h2>
      </div>

      {/* Buscador */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#FFFFFF' }}>
          <Search size={14} style={{ color: '#B8CBEF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="flex-1 bg-transparent text-[13px] focus:outline-none"
            style={{ color: '#0047AB' }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm" style={{ color: '#B8CBEF' }}>
              {search ? 'Sin resultados.' : 'Sin conversaciones aún. Contacta a alguien desde el feed.'}
            </p>
          </div>
        ) : (
          filtered.map(conv => {
            const other = conv.user1_id === userId ? conv.user2 : conv.user1
            const name   = publicName(other || {})
            const active = activeId === conv.id
            const unread = conv.unread_count > 0

            return (
              <button key={conv.id} onClick={() => onSelect(conv)}
                className="w-full text-left transition-colors"
                style={{ background: active ? '#F5F8FD' : unread ? '#F7FAFF' : '#ffffff',
                  borderBottom: '1px solid #FFFFFF' }}>
                <div className="flex items-center gap-3.5 px-4 py-3.5">

                  {/* Avatar con indicador online */}
                  <div className="relative flex-shrink-0">
                    <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
                      style={{ background: active || unread ? '#0047AB' : '#D6E2F5',
                        color: active || unread ? '#fff' : '#3A5590' }}>
                      {name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[15px] truncate"
                        style={{ color: '#0047AB', fontWeight: unread ? 700 : 600 }}>
                        {name}
                      </span>
                      <span className="text-[12px] flex-shrink-0 ml-2"
                        style={{ color: unread ? '#2C6BD4' : '#B8CBEF', fontWeight: unread ? 600 : 400 }}>
                        {timeAgo(conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] truncate"
                        style={{ color: unread ? '#3A5590' : '#B8CBEF',
                          fontWeight: unread ? 600 : 400 }}>
                        {conv.last_message || (conv.posts ? `Sobre: ${conv.posts.title}` : 'Nueva conversación')}
                      </span>
                      {unread && (
                        <div className="flex-shrink-0 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold px-1.5"
                          style={{ background: '#2C6BD4', color: '#0047AB' }}>
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─── Hilo de mensajes estilo C6 (yo celeste, ellos blanco) ─── */
function ChatThread({ conversation, userId, myProfile }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const other = conversation.user1_id === userId ? conversation.user2 : conversation.user1
  const otherName = publicName(other || {})

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessages(conversation.id)
      setMessages(data)
    } catch (e) { toast(safeErrorMessage(e), 'error') }
  }, [conversation.id, toast])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setMessages([])
    fetchMessages().finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [fetchMessages])

  useRealtime('messages', 'INSERT', useCallback((payload) => {
    const msg = payload.new
    if (msg?.conversation_id !== conversation.id) return
    if (msg.sender_id === userId) return
    setMessages(prev => [...prev, { ...msg, profiles: other }])
  }, [conversation.id, userId, other]))

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    try {
      const sent = await sendMessage({ conversation_id: conversation.id, sender_id: userId, content })
      setMessages(prev => [...prev, { ...sent, profiles: myProfile || {} }])
      const otherId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id
      createNotification({
        user_id: otherId,
        from_user_id: userId,
        type: 'message',
        content: 'te envió un mensaje',
        post_id: conversation.post_id,
      })
    } catch (e) { toast(safeErrorMessage(e), 'error'); setText(content) }
    setSending(false)
  }

  // Agrupar mensajes por fecha
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.created_at).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: '#ffffff', boxShadow: '0 4px 14px rgba(0,71,171,0.06)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
          style={{ background: '#0047AB' }}>
          {otherName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: '#0047AB' }}>{otherName}</p>
          {other?.city && <p className="text-[11px]" style={{ color: '#3A5590' }}>{other.city}</p>}
        </div>
      </div>

      {/* Post de referencia */}
      {conversation.posts && (
        <button onClick={() => navigate('/feed', { state: { scrollToPostId: conversation.posts.id } })}
          className="mx-4 mt-2 mb-1 flex-shrink-0 flex items-start gap-2.5 px-3.5 py-3 rounded-2xl text-left transition-all active:scale-[0.98] w-[calc(100%-2rem)]"
          style={{ background: 'linear-gradient(135deg,#EBF1FC,#F4F7FD)' }}>
          <span className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg,#0047AB,#2C6BD4)', boxShadow: '0 3px 8px rgba(0,71,171,0.25)' }}>
            <MessageSquareText size={16} color="#fff" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#0047AB' }}>
                {CATEGORY_MAP[conversation.posts.category]?.label || conversation.posts.category}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: '#8FA3C7' }}>· Ver publicación</span>
            </div>
            <p className="text-[13px] font-bold leading-snug line-clamp-2" style={{ color: '#33456B' }}>
              {[conversation.posts.title, conversation.posts.content].filter(Boolean).join(' — ').slice(0, 90)}
            </p>
          </div>
        </button>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: '#E4EBF7' }}>
        {loading ? (
          <div className="flex justify-center py-6"><Spinner size={20} /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs py-6" style={{ color: '#B8CBEF' }}>Inicia la conversación.</p>
        ) : (
          Object.entries(grouped).map(([day, msgs]) => (
            <div key={day}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px" style={{ background: '#E4EDFB' }} />
                <span className="text-[10px] font-medium px-3 py-1 rounded-full capitalize"
                  style={{ background: '#EBF1FC', color: '#5578AD' }}>{day}</span>
                <div className="flex-1 h-px" style={{ background: '#E4EDFB' }} />
              </div>

              <div className="flex flex-col gap-1.5">
                {msgs.map((msg, i) => {
                  const isMine = msg.sender_id === userId
                  const isLast = i === msgs.length - 1 ||
                    msgs[i+1]?.sender_id !== msg.sender_id
                  return (
                    <div key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div style={{ maxWidth: '75%' }}>
                        <div className="px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
                          style={{
                            background: isMine ? 'linear-gradient(135deg,#0047AB,#2C6BD4)' : '#ffffff',
                            color: isMine ? '#ffffff' : '#33456B',
                            borderRadius: isMine
                              ? isLast ? '19px 19px 6px 19px' : '19px'
                              : isLast ? '19px 19px 19px 6px' : '19px',
                            border: 'none',
                            boxShadow: isMine ? '0 5px 14px rgba(0,71,171,0.25)' : '0 6px 18px rgba(0,71,171,0.13)',
                            fontWeight: 500,
                          }}>
                          {msg.content}
                        </div>
                        {isLast && (
                          <div className={`text-[11px] mt-1.5 font-semibold ${isMine ? 'text-right pr-1' : 'pl-1'}`}
                            style={{ color: '#8FA3C7' }}>
                            {new Date(msg.created_at).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
                            {isMine && ' ✓✓'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex-shrink-0 flex items-end gap-2.5"
        style={{ background: 'transparent' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 px-4 py-3 text-[16px] resize-none focus:outline-none rounded-[20px]"
          style={{ background: '#ffffff', border: 'none', boxShadow: '0 4px 14px rgba(0,71,171,0.08)', color: '#0A2A5C', fontWeight: 500,
            maxHeight: 110, lineHeight: 1.4 }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
        />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#0047AB,#2C6BD4)', boxShadow: '0 6px 16px rgba(0,71,171,0.3)' }}>
          {sending ? <Spinner size={16} color="#fff" /> : <Send size={18} color="#fff" />}
        </button>
      </div>
    </div>
  )
}

/* ─── Página principal ─── */
export default function ChatsPage() {
  const { session, profile: myProfile } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)
  const autoSelected = useRef(false)

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations(session.user.id)
      setConversations(data)
      const convId = location.state?.convId
      if (convId && !autoSelected.current) {
        autoSelected.current = true
        const found = data.find(c => c.id === convId)
        if (found) setActive(found)
      }
    } catch (e) { toast(safeErrorMessage(e), 'error') }
  }, [session.user.id, toast, location.state?.convId])

  useEffect(() => {
    let mounted = true
    loadConversations().finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [loadConversations])

  useRealtime('messages', 'INSERT', useCallback((payload) => {
    const msg = payload?.new
    if (!msg) return
    const myId = session?.user?.id
    const inMyConvs = conversations.some(c => c.id === msg.conversation_id)
    if (inMyConvs || msg.sender_id === myId) loadConversations()
  }, [loadConversations, conversations, session?.user?.id]))

  return (
    <div className="page-enter flex overflow-hidden rounded-2xl"
      style={{ height: 'calc(100vh - 140px)', background: '#ffffff', boxShadow: '0 8px 28px rgba(0,71,171,0.09)' }}>

      {/* Bandeja */}
      <div className={`md:w-[300px] md:border-r flex-shrink-0 overflow-hidden flex flex-col ${active ? 'hidden md:flex' : 'w-full flex'}`}
        style={{ borderColor: '#EBF1FC' }}>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16" />)}</div>
        ) : (
          <ConversationList conversations={conversations} activeId={active?.id}
            onSelect={setActive} userId={session.user.id} />
        )}
      </div>

      {/* Hilo */}
      <div className={`flex-1 flex flex-col overflow-hidden ${active ? 'flex' : 'hidden md:flex'}`}>
        {active ? (
          <>
            <div className="md:hidden flex items-center gap-2 px-4 py-3 flex-shrink-0"
              style={{ background: '#ffffff' }}>
              <button onClick={() => setActive(null)} className="p-1 rounded-lg"
                style={{ color: '#0047AB' }}>
                <ArrowLeft size={20} />
              </button>
              <p className="text-sm font-semibold truncate" style={{ color: '#0047AB' }}>Mensajes</p>
            </div>
            <ChatThread conversation={active} userId={session.user.id} myProfile={myProfile} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm" style={{ color: '#B8CBEF' }}>Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  )
}
