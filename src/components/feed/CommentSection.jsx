import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { getComments, createComment } from '../../api/comments'
import { createNotification } from '../../api/notifications'
import { getMentionCandidates } from '../../api/follows'
import { useAuth } from '../../contexts/AuthContext'
import { publicName, timeAgo } from '../../lib/helpers'
import UserAvatar from '../shared/UserAvatar'
import Spinner from '../shared/Spinner'

function renderWithMentions(content) {
  const parts = content.split(/(@[\w.\-]+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-brand-600 font-medium">{part}</span>
      : part
  )
}

export default function CommentSection({ post, isOpen }) {
  const { session } = useAuth()
  const [comments, setComments]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const loadedRef = useRef(false)

  // ── Menciones ──────────────────────────────────────────────────────────────
  const [followCandidates, setFollowCandidates] = useState([])  // a quienes sigo/me siguen
  const [postParticipants, setPostParticipants]  = useState([])  // autor + comentaristas del post
  const [mentionQuery, setMentionQuery]          = useState(null)
  const [mentioned, setMentioned]                = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !post?.id || loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    getComments(post.id)
      .then(data => {
        setComments(data)
        // Participantes del post: autor + quienes comentaron (sin duplicados, sin yo mismo)
        const myId = session?.user?.id
        const seen = new Set()
        const participants = []
        // autor primero
        if (post.profiles?.id && post.profiles.id !== myId) {
          seen.add(post.profiles.id)
          participants.push({ ...post.profiles, _isAuthor: true })
        }
        // comentaristas
        for (const c of data) {
          const p = c.profiles
          if (p?.id && p.id !== myId && !seen.has(p.id)) {
            seen.add(p.id)
            participants.push(p)
          }
        }
        setPostParticipants(participants)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, post?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar seguidores/seguidos una vez al abrir
  useEffect(() => {
    if (!isOpen || !session?.user?.id) return
    getMentionCandidates(session.user.id).then(setFollowCandidates).catch(() => {})
  }, [isOpen, session?.user?.id])

  const onChangeText = (value) => {
    setText(value)
    const match = value.match(/@([\w.\-]*)$/)
    setMentionQuery(match ? match[1].toLowerCase() : null)
  }

  // Sugerencias: primero participantes del post, luego seguidores (sin duplicar)
  const suggestions = mentionQuery !== null ? (() => {
    const q = mentionQuery.replace(/\s+/g, '')
    const matches = (p) => publicName(p).toLowerCase().replace(/\s+/g, '').includes(q)
    const participantIds = new Set(postParticipants.map(p => p.id))
    const postMatches  = postParticipants.filter(matches)
    const followMatches = followCandidates.filter(p => !participantIds.has(p.id) && matches(p))
    return [...postMatches, ...followMatches].slice(0, 6)
  })() : []

  // Saber si un candidato viene del post o de follows (para la cabecera del grupo)
  const participantIds = new Set(postParticipants.map(p => p.id))

  const pickMention = (prof) => {
    const handle = publicName(prof).replace(/\s+/g, '')
    const newText = text.replace(/@([\w.\-]*)$/, `@${handle} `)
    setText(newText)
    setMentionQuery(null)
    setMentioned(prev => prev.find(m => m.id === prof.id) ? prev : [...prev, prof])
    inputRef.current?.focus()
  }

  const handleSubmit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const comment = await createComment({
        post_id: post.id,
        user_id: session.user.id,
        content: text.trim(),
      })
      setComments(prev => [...prev, comment])

      if (post.author_id !== session.user.id) {
        createNotification({
          user_id: post.author_id, from_user_id: session.user.id,
          type: 'comment',
          content: `comentó en tu publicación: "${text.trim().slice(0, 60)}"`,
          post_id: post.id,
        })
      }

      const finalText = text.trim()
      for (const m of mentioned) {
        const handle = publicName(m).replace(/\s+/g, '')
        if (!finalText.includes(`@${handle}`)) continue
        if (m.id === session.user.id || m.id === post.author_id) continue
        createNotification({
          user_id: m.id, from_user_id: session.user.id,
          type: 'mention',
          content: `te mencionó en un comentario`,
          post_id: post.id,
        })
      }

      setText('')
      setMentioned([])
      setMentionQuery(null)
    } catch (e) { console.error('Comment error:', e) }
    setSending(false)
  }

  if (!isOpen) return null

  // Índice de si cada sugerencia viene del post (para separador visual)
  let lastWasPost = null

  return (
    <div className="border-t border-ink-100 pt-3 mt-3">
      {loading ? (
        <div className="flex justify-center py-3"><Spinner size={16} className="text-brand-600" /></div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-2.5 mb-3 max-h-[200px] overflow-y-auto">
              {comments.map(c => {
                const prof = c.profiles || {}
                const name = publicName(prof)
                return (
                  <div key={c.id} className="flex items-start gap-2">
                    <UserAvatar seed={prof.id || name} avatarUrl={prof.avatar_url} size={26} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-ink-900">{name}</span>
                        <span className="text-[10px] text-ink-400">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-ink-700 mt-0.5">{renderWithMentions(c.content)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {comments.length === 0 && (
            <p className="text-[11px] text-ink-400 text-center mb-3">Sé el primero en comentar</p>
          )}

          <div className="relative">
            {/* Dropdown de menciones con dos secciones */}
            {suggestions.length > 0 && (
              <div className="absolute bottom-full mb-1 left-8 right-0 bg-white border border-ink-300 rounded-xl shadow-lg overflow-hidden z-10">
                {suggestions.map((p, idx) => {
                  const isPost = participantIds.has(p.id)
                  const prevIsPost = idx === 0 ? null : participantIds.has(suggestions[idx - 1].id)
                  const showHeader = idx === 0 || isPost !== prevIsPost
                  return (
                    <div key={p.id}>
                      {showHeader && (
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-ink-400 uppercase tracking-wider bg-ink-50 border-b border-ink-100 flex items-center gap-1.5">
                          {isPost
                            ? <><span>👥</span> En este post</>
                            : <><span>✅</span> Personas que sigues</>
                          }
                        </div>
                      )}
                      <button type="button" onClick={() => pickMention(p)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink-50 text-left transition-colors">
                        <UserAvatar seed={p.id} avatarUrl={p.avatar_url} size={24} />
                        <div className="min-w-0">
                          <span className="text-[12px] text-ink-900 font-medium">{publicName(p)}</span>
                          {p._isAuthor && (
                            <span className="ml-1.5 text-[10px] text-brand-600 font-medium">Autor</span>
                          )}
                          {p.city && (
                            <p className="text-[10px] text-ink-400 truncate">{p.city}</p>
                          )}
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <UserAvatar seed={session?.user?.id || 'me'} size={26} />
              <input ref={inputRef} value={text} onChange={e => onChangeText(e.target.value)}
                placeholder="Escribe un comentario... (usa @ para etiquetar)"
                className="flex-1 px-3 py-1.5 rounded-full border border-ink-200 text-xs focus:outline-none focus:border-brand-600 bg-ink-100/50"
                onKeyDown={e => { if (e.key === 'Enter' && suggestions.length === 0) handleSubmit() }} />
              <button onClick={handleSubmit} disabled={!text.trim() || sending}
                className="p-1.5 rounded-full bg-brand-600 text-white disabled:opacity-30 hover:bg-brand-700">
                {sending ? <Spinner size={12} /> : <Send size={12} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
