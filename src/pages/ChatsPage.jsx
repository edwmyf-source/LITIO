import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getConversations, getMessages, sendMessage } from '../api/messages'
import { createNotification } from '../api/notifications'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../hooks/useRealtime'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'
import { publicName, timeAgo } from '../lib/helpers'
import UserAvatar from '../components/shared/UserAvatar'
import Spinner from '../components/shared/Spinner'

function ConversationList({ conversations, activeId, onSelect, userId }) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-xs text-ink-500 text-center">Sin conversaciones aún. Contacta a alguien desde el feed.</p>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      {conversations.map(conv => {
        const other = conv.user1_id === userId ? conv.user2 : conv.user1
        const name = publicName(other || {})
        const active = activeId === conv.id
        return (
          <button key={conv.id} onClick={() => onSelect(conv)}
            className={`w-full text-left p-3 rounded-2xl flex items-start gap-2.5 transition-colors ${
              active ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-slate-50'
            }`}>
            <UserAvatar seed={other?.id || name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[13px] font-medium text-ink-900 truncate">{name}</span>
                <span className="text-[10px] text-ink-400 flex-shrink-0">{timeAgo(conv.updated_at)}</span>
              </div>
              {conv.posts && (
                <p className="text-[10px] text-brand-600 truncate">{conv.posts.title}</p>
              )}
              {conv.last_message && (
                <p className="text-[11px] text-ink-500 truncate mt-0.5">{conv.last_message}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ChatThread({ conversation, userId, myProfile }) {
  const toast = useToast()
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

  // Realtime: solo agregar mensajes del OTRO usuario — los propios ya se appendean optimistamente
  useRealtime('messages', 'INSERT', useCallback((payload) => {
    const msg = payload.new
    if (msg?.conversation_id !== conversation.id) return
    if (msg.sender_id === userId) return           // ya está en pantalla por append optimista
    setMessages(prev => [...prev, { ...msg, profiles: other }])
  }, [conversation.id, userId, other]))

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')                                    // limpiar input de inmediato
    setSending(true)
    try {
      const sent = await sendMessage({ conversation_id: conversation.id, sender_id: userId, content })
      // Append optimista con el objeto real devuelto por la DB
      setMessages(prev => [...prev, { ...sent, profiles: myProfile || {} }])
      const otherId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id
      createNotification({
        user_id: otherId,
        from_user_id: userId,
        type: 'message',
        content: `te envió un mensaje`,
        post_id: conversation.post_id,
      })
    } catch (e) { toast(safeErrorMessage(e), 'error'); setText(content) }  // restaurar si falla
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-ink-300 px-4 py-3 flex items-center gap-3">
        <UserAvatar seed={other?.id || otherName} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-ink-900 truncate">{otherName}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <span>{other?.city || 'Colombia'}</span>
          </div>
        </div>
      </div>

      {/* Post reference */}
      {conversation.posts && (
        <div className="bg-brand-500/5 border-b border-ink-200 px-4 py-2">
          <p className="text-[11px] text-ink-500">Sobre: <span className="text-ink-700 font-medium">{conversation.posts.title}</span></p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-ink-100">
        {loading ? (
          <div className="flex justify-center py-6"><Spinner size={20} className="text-brand-600" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-ink-500 py-6">Inicia la conversación.</p>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === userId
            const prof = msg.profiles || {}
            const name = publicName(prof)
            return (
              <div key={msg.id} className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                <UserAvatar seed={prof.id || name} size={30} />
                <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-medium text-ink-900">{isMine ? 'Tú' : name}</span>
                    <span className="text-[10px] text-ink-500">{timeAgo(msg.created_at)}</span>
                  </div>
                  <div className={`rounded-2xl px-3 py-2.5 ${
                    isMine ? 'bg-brand-600 text-white' : 'bg-white border border-ink-300 text-ink-900'
                  }`}>
                    <p className="text-[13px] whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-ink-300 bg-white">
        <div className="flex gap-2 items-end">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Escribe un mensaje..." rows={2}
            className="flex-1 px-3 py-2 rounded-2xl border border-ink-300 text-[13px] resize-none focus:outline-none focus:border-brand-600"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl px-4 flex items-center gap-1.5 text-[13px] font-medium disabled:opacity-50">
            {sending ? <Spinner size={14} /> : <><Send size={13} /> Enviar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    // Solo recargar si el mensaje pertenece a una conversación donde participo
    if (!msg) return
    const myId = session?.user?.id
    const inMyConvs = conversations.some(c => c.id === msg.conversation_id)
    if (inMyConvs || msg.sender_id === myId) {
      loadConversations()
    }
  }, [loadConversations, conversations, session?.user?.id]))

  return (
    <div className="page-enter flex bg-white border border-ink-300 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
      <div className={`md:w-[300px] md:border-r border-ink-300 bg-ink-100 overflow-y-auto flex-shrink-0 ${active ? 'hidden md:block' : 'w-full'}`}>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16" />)}</div>
        ) : (
          <ConversationList conversations={conversations} activeId={active?.id}
            onSelect={setActive} userId={session.user.id} />
        )}
      </div>

      <div className={`flex-1 flex flex-col ${active ? 'block' : 'hidden md:flex'}`}>
        {active ? (
          <>
            <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-ink-300 bg-white">
              <button onClick={() => setActive(null)} aria-label="Volver a conversaciones" className="p-1 rounded hover:bg-slate-50 text-ink-900">
                <ArrowLeft size={20} />
              </button>
              <p className="text-sm font-semibold text-ink-900 truncate">Inbox</p>
            </div>
            <ChatThread conversation={active} userId={session.user.id} myProfile={myProfile} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <h3 className="font-semibold text-lg text-ink-900 mb-1">Inbox</h3>
            <p className="text-sm text-ink-500 max-w-xs">Selecciona una conversación para ver los mensajes.</p>
          </div>
        )}
      </div>
    </div>
  )
}
