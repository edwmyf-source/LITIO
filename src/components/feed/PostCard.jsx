import { useState, useRef, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Loader2, FileText, MoreHorizontal, Flag, UserX, Send, Share2, ThumbsUp } from 'lucide-react'
import { timeAgo, publicName } from '../../lib/helpers'
import { CATEGORY_MAP } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { blockUser } from '../../api/moderation'
import { toggleReaction, getReactionsForPost } from '../../api/reactions'
import { createNotification } from '../../api/notifications'
import { useToast } from '../shared/Toast'
import UserAvatar from '../shared/UserAvatar'
import CommentSection from './CommentSection'
import ReportModal from './ReportModal'

function MediaGallery({ media }) {
  if (!media || media.length === 0) return null
  const images = media.filter(m => m.type?.startsWith('image/'))
  const videos = media.filter(m => m.type?.startsWith('video/'))
  const pdfs   = media.filter(m => m.type === 'application/pdf')

  return (
    <div className="mb-2 space-y-1.5">
      {images.length > 0 && (
        <div className={`grid gap-1 rounded-2xl overflow-hidden ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="relative bg-ink-100"
              style={{ aspectRatio: images.length === 1 ? '16/9' : '1/1' }}>
              <img src={img.url} alt="" loading="lazy" decoding="async"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => window.open(img.url, '_blank')} />
              {idx === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {videos.map((vid, idx) => (
        <div key={idx} className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video src={vid.url} controls className="w-full h-full object-contain" preload="none" />
        </div>
      ))}
      {pdfs.map((pdf, idx) => (
        <a key={idx} href={pdf.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-2 rounded-xl border border-ink-200 bg-ink-50 hover:bg-slate-50 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-danger-500/10 flex items-center justify-center flex-shrink-0">
            <FileText size={14} className="text-danger-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-ink-900 truncate group-hover:text-brand-600">
              {pdf.name || 'Documento PDF'}
            </p>
            <p className="text-[10px] text-ink-400">PDF · Click para abrir</p>
          </div>
        </a>
      ))}
    </div>
  )
}

function PostMenu({ post, onReport }) {
  const { session } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleBlock = async () => {
    setOpen(false)
    try {
      await blockUser(session.user.id, post.author_id)
      toast('Usuario bloqueado.', 'success')
    } catch { toast('Error al bloquear', 'error') }
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Más opciones"
        className="p-1 rounded-lg hover:bg-slate-50 text-ink-400 hover:text-ink-600 transition-colors">
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-20 bg-white border border-ink-200 rounded-xl shadow-lg py-1 w-44">
          <button onClick={() => { setOpen(false); onReport() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-ink-700 hover:bg-ink-50 hover:text-danger-600">
            <Flag size={12} className="text-ink-400" />
            Reportar publicación
          </button>
          <button onClick={handleBlock}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-ink-700 hover:bg-ink-50 hover:text-danger-600">
            <UserX size={12} className="text-ink-400" />
            Bloquear usuario
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(function PostCard({ post, onContact, contactingId, blockedUsers = [], accentColor = '#7c3aed' }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user?.id
  const [showComments, setShowComments] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const likeInitialized = useRef(false)

  useEffect(() => {
    if (likeInitialized.current) return
    likeInitialized.current = true
    const source = post.reactions ?? null
    if (source !== null) {
      const likes = source.filter(r => r.type === 'like')
      setLikeCount(likes.length)
      setLiked(likes.some(r => r.user_id === userId))
    } else {
      getReactionsForPost(post.id).then(data => {
        const likes = data.filter(r => r.type === 'like')
        setLikeCount(likes.length)
        setLiked(likes.some(r => r.user_id === userId))
      }).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = async () => {
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => Math.max(0, c + (wasLiked ? -1 : 1)))
    try {
      const result = await toggleReaction(post.id, userId, 'like')
      if (result.action === 'added' && post.author_id !== userId) {
        createNotification({
          user_id: post.author_id, from_user_id: userId,
          type: 'reaction',
          content: 'le dio me gusta a tu publicación',
          post_id: post.id,
        })
      }
    } catch (e) {
      console.error('Like error:', e)
      setLiked(wasLiked)
      setLikeCount(c => Math.max(0, c + (wasLiked ? 1 : -1)))
    }
  }

  if (blockedUsers.includes(post.author_id)) return null

  const prof      = post.profiles || {}
  const name      = publicName(prof)
  const isMine    = post.author_id === session?.user?.id
  const catObj    = CATEGORY_MAP[post.category]
  const catLabel  = catObj?.label || post.category
  const isContacting = contactingId === post.id

  let media = []
  if (post.media) {
    try { media = typeof post.media === 'string' ? JSON.parse(post.media) : post.media }
    catch { media = [] }
  }

  // Texto muro: título + contenido como un solo bloque
  const wallText = [post.title, post.content].filter(Boolean).join('\n\n')

  const goToProfile = () => navigate(`/u/${post.author_id}`)

  return (
    <div className="px-4 pt-3 pb-2" style={{background:"#ffffff"}} id={`post-${post.id}`}>

      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <button onClick={goToProfile} aria-label={`Ver perfil de ${name}`} className="flex-shrink-0">
          <UserAvatar seed={prof.id || name} avatarUrl={prof.avatar_url} size={40} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <button onClick={goToProfile}
                className="text-[15px] font-semibold leading-snug text-left hover:underline block truncate" style={{color:"#0047AB"}}>
                {name}
              </button>
              {prof.quimica_personaje && (
                <span title={prof.quimica_nombre || ''} className="text-base leading-none flex-shrink-0 cursor-default">
                  {prof.quimica_personaje}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {post.subcategory === 'Novedades' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 leading-none flex items-center gap-0.5">
                  ⚡ NOVEDAD
                </span>
              ) : catLabel && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 leading-none">
                  {catLabel}
                </span>
              )}
              
              {!isMine && <PostMenu post={post} onReport={() => setReportOpen(true)} />}
            </div>
          </div>
          {prof.city && (
            <p className="text-[12px] leading-tight mt-0.5" style={{color:"#7EB6FF"}}>{prof.city}</p>
          )}
          <p className="text-[11px] mt-0.5" style={{color:"#A7D8FF"}}>{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Texto muro — un solo bloque, tipografía uniforme */}
      <p className="text-[14px] leading-relaxed mb-2 whitespace-pre-wrap break-words line-clamp-5" style={{color:"#37474f"}}>
        {wallText}
      </p>

      <MediaGallery media={media} />

      {/* Footer estilo LinkedIn */}
      <div className="pt-1.5 mt-1" style={{ borderTop: '1px solid #e0e0e0' }}>
        <div className="flex items-center" style={{ paddingTop: '1px' }}>
          <button onClick={handleLike}
            className="flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:bg-gray-50"
            style={{ color: liked ? '#1d4ed8' : '#666' }}>
            <ThumbsUp size={14} fill={liked ? '#1d4ed8' : 'none'} /> Me gusta
          </button>
          <button onClick={() => setShowComments(!showComments)}
            className="flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:bg-gray-50"
            style={{ color: '#666' }}>
            <MessageCircle size={14} /> Comentar
          </button>
          <button className="flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:bg-gray-50"
            style={{ color: '#666' }}>
            <Share2 size={14} /> Compartir
          </button>
          {!isMine && (
            <button onClick={() => onContact?.(post)} disabled={isContacting}
              className="flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-60 hover:bg-gray-50"
              style={{ color: isContacting ? '#999' : '#2F80ED' }}>
              {isContacting
                ? <><Loader2 size={14} className="animate-spin" /> Abriendo...</>
                : <><Send size={14} /> Contactar</>}
            </button>
          )}
        </div>
        {(likeCount > 0 || post.comment_count > 0) && (
          <div className="flex items-center justify-between px-1 pt-0.5">
            {likeCount > 0 && (
              <span className="text-[10px]" style={{ color: '#666' }}>
                {likeCount} me gusta
              </span>
            )}
            {post.comment_count > 0 && (
              <span className="text-[10px] ml-auto cursor-pointer hover:underline" style={{ color: '#666' }}
                onClick={() => setShowComments(!showComments)}>
                {post.comment_count} comentario{post.comment_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <CommentSection post={post} isOpen={showComments} />
      <ReportModal post={post} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
})
