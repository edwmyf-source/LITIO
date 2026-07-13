import { useState, useRef, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Loader2, FileText, MoreHorizontal, Flag, UserX, Send, ThumbsUp } from 'lucide-react'
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
              style={images.length === 1 ? { maxHeight: 320, aspectRatio: '16/9' } : { aspectRatio: '1/1' }}>
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
        <div key={idx} className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9', maxHeight: 320 }}>
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

  // Mapea categoria del post al color de su tab (borde lateral V6)
  const CAT_TO_TAB = { productos:'tienda', servicios:'tienda', empleos:'vacantes', informacion:'novedades' }
  const tabKey = CAT_TO_TAB[post.category] || 'todo'
  const catAccent = {
    todo:      '#7c3aed',
    novedades: '#16a34a',
    tienda:    '#0369a1',
    vacantes:  '#ea580c',
  }[tabKey]

  let media = []
  if (post.media) {
    try { media = typeof post.media === 'string' ? JSON.parse(post.media) : post.media }
    catch { media = [] }
  }

  // Texto muro: título + contenido como un solo bloque
  const wallText = [post.title, post.content].filter(Boolean).join('\n\n')

  const goToProfile = () => navigate(`/u/${post.author_id}`)

  return (
    <div className="flex overflow-hidden rounded-xl" style={{ background:"#ffffff", border:'1px solid #CDDBEC' }} id={`post-${post.id}`}>

      {/* Barra lateral de categoria */}
      <div className="flex-shrink-0" style={{ width: 5, background: catAccent }} />

      {/* Contenido de la publicacion */}
      <div className="flex-1 min-w-0 px-3 pt-2.5 pb-2">

      {/* Header */}
      <div className="flex items-start gap-2.5 mb-1.5">
        <button onClick={goToProfile} aria-label={`Ver perfil de ${name}`} className="flex-shrink-0">
          <UserAvatar seed={prof.id || name} avatarUrl={prof.avatar_url} size={26} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <button onClick={goToProfile}
              className="text-[12px] font-semibold leading-snug text-left hover:underline block truncate" style={{color:"#001A3D"}}>
              {name}
            </button>
            {!isMine && <PostMenu post={post} onReport={() => setReportOpen(true)} />}
          </div>
          <p className="text-[10px] leading-tight mt-px truncate" style={{ color: '#5D8BC7' }}>
            {prof.city && <>{prof.city} · </>}
            {timeAgo(post.created_at)}
            {catLabel && <> · <span style={{ color: catAccent, fontWeight: 700 }}>{catLabel.toUpperCase()}</span></>}
          </p>
        </div>
      </div>

      {/* Texto muro — un solo bloque, tipografía uniforme */}
      <p className="text-[14px] leading-snug mb-1.5 whitespace-pre-wrap break-words line-clamp-5" style={{color:"#37474f"}}>
        {wallText}
      </p>

      <MediaGallery media={media} />

      {/* Footer V6: pills con contador integrado + CTA primario a la derecha */}
      <div className="pt-2 mt-1 flex items-center gap-2" style={{ borderTop: '1px solid #DDE7F4' }}>
        <button onClick={handleLike}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
          style={{ background: liked ? '#001A3D' : '#F2F7FF', color: liked ? '#fff' : '#001A3D' }}>
          <ThumbsUp size={12} fill={liked ? '#fff' : 'none'} />
          <span className="font-bold">{likeCount || 0}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
          style={{ background: '#F2F7FF', color: '#001A3D' }}>
          <MessageCircle size={12} />
          <span className="font-bold">{post.comment_count || 0}</span>
        </button>
        {!isMine && (
          <button onClick={() => onContact?.(post)} disabled={isContacting}
            className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white transition-opacity disabled:opacity-60"
            style={{ background: '#001A3D' }}>
            {isContacting
              ? <><Loader2 size={12} className="animate-spin" /> ...</>
              : <>Contactar <Send size={12} /></>}
          </button>
        )}
      </div>

      <CommentSection post={post} isOpen={showComments} />
      <ReportModal post={post} open={reportOpen} onClose={() => setReportOpen(false)} />
      </div>
    </div>
  )
})
