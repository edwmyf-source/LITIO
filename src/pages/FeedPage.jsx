import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Clock, ArrowUp } from 'lucide-react'
import { listPosts } from '../api/posts'
import { getOrCreateConversation } from '../api/messages'
import { createNotification } from '../api/notifications'
import { getBlockedUsers } from '../api/moderation'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../hooks/useRealtime'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'
import PostCard from '../components/feed/PostCard'
import PublishBox from '../components/feed/PublishBox'
import InlinePublishBox from '../components/feed/InlinePublishBox'
import FilterBar from '../components/feed/FilterBar'
import PublishSuccessModal from '../components/feed/PublishSuccessModal'
import BannerCarousel from '../components/feed/BannerCarousel'
import Spinner from '../components/shared/Spinner'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import { TAB_COLOR } from '../lib/constants'

const SORT_OPTIONS = [
  { value: 'smart',   label: 'Relevante', icon: Sparkles },
  { value: 'recent',  label: 'Reciente',  icon: Clock },
]

// Debounce helper
function useDebounce(value, ms) {
  const [deb, setDeb] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return deb
}

export default function FeedPage() {
  const { session } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  // Abrir modal de publicación si viene ?publish=1 desde el sidebar
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('publish') === '1') {
      setPublishOpen(true)
      navigate('/feed', { replace: true })
    }
  }, [location.search, navigate])
  const toast       = useToast()

  const [posts,          setPosts         ] = useState([])
  const [loading,        setLoading       ] = useState(true)
  const [loadingMore,    setLoadingMore   ] = useState(false)
  const [hasMore,        setHasMore       ] = useState(true)
  const [filters,        setFilters       ] = useState({})
  const [sort,           setSort          ] = useState('smart')
  const [publishOpen,    setPublishOpen   ] = useState(false)
  const [successOpen,    setSuccessOpen   ] = useState(false)
  const [lastPublishedId,setLastPublishedId] = useState(null)
  const [contactingPost, setContactingPost] = useState(null)
  const [blockedUsers,   setBlockedUsers  ] = useState([])
  const sentinel = useRef(null)

  // Debounce búsqueda: espera 400ms antes de consultar
  const debouncedFilters = useDebounce(filters, 400)

  // Cargar usuarios bloqueados al montar
  useEffect(() => {
    if (session?.user?.id) {
      getBlockedUsers(session.user.id).then(setBlockedUsers).catch(() => {})
    }
  }, [session?.user?.id])

  const fetchPosts = useCallback(async (cursor, append = false) => {
    try {
      // Timeout de 10s: si Supabase no responde, muestra error en lugar de spinner eterno
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('La conexión tardó demasiado. Intenta de nuevo.')), 10000)
      )
      const data = await Promise.race([
        listPosts({ cursor, limit: 20, filters: debouncedFilters, sort }),
        timeout,
      ])
      if (append) setPosts(p => [...p, ...data])
      else setPosts(data)
      setHasMore(data.length === 20)
    } catch (e) { toast(safeErrorMessage(e), 'error') }
  }, [debouncedFilters, sort, toast])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchPosts().finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [fetchPosts])

  // Realtime: no reemplazar el feed solo (rompe scroll). Avisar con un botón.
  const [newPostsAvailable, setNewPostsAvailable] = useState(false)
  useRealtime('posts', 'INSERT', useCallback(() => {
    setNewPostsAvailable(true)
  }, []))

  const loadNewPosts = useCallback(() => {
    setNewPostsAvailable(false)
    fetchPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchPosts])

  // Infinite scroll con IntersectionObserver — usamos refs para no recrear
  // el observer en cada cambio de `posts` (eso causaba renders en cascada)
  const stateRef = useRef({ posts, hasMore, loadingMore })
  stateRef.current = { posts, hasMore, loadingMore }

  useEffect(() => {
    if (!sentinel.current) return
    const obs = new IntersectionObserver(([entry]) => {
      const { posts: ps, hasMore: hm, loadingMore: lm } = stateRef.current
      if (entry.isIntersecting && hm && !lm && ps.length > 0) {
        setLoadingMore(true)
        const cursor = ps[ps.length - 1].created_at
        fetchPosts(cursor, true).finally(() => setLoadingMore(false))
      }
    }, { rootMargin: '300px' })
    obs.observe(sentinel.current)
    return () => obs.disconnect()
  }, [fetchPosts])

  // Venimos de una notificación: ir directo al post mencionado
  useEffect(() => {
    const targetId = location.state?.scrollToPostId
    if (!targetId || loading || posts.length === 0) return
    handleScrollToPost(targetId)
  }, [location.state?.scrollToPostId, loading, posts])

  const handlePublished = (newPost) => {
    setLastPublishedId(newPost?.id || null)
    setPublishOpen(false)
    setSuccessOpen(true)
    fetchPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContact = useCallback(async (post) => {
    if (contactingPost) return
    setContactingPost(post.id)
    try {
      const conv = await getOrCreateConversation(session.user.id, post.author_id, post.id)
      if (post.author_id !== session.user.id) {
        createNotification({
          user_id: post.author_id, from_user_id: session.user.id,
          type: 'message', content: `quiere contactarte sobre "${post.title.slice(0, 50)}"`,
          post_id: post.id,
        })
      }
      navigate('/chats', { state: { convId: conv.id } })
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setContactingPost(null)
  }, [session?.user?.id, navigate, toast, contactingPost])

  const handleScrollToPost = (postId) => {
    const el = document.getElementById(`post-${postId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else {
      // Si no está en pantalla, refrescar con sort reciente y buscar
      setSort('recent')
    }
  }

  const activeTab = filters.tab || 'todo'
  const tabStyle = TAB_COLOR[activeTab] || TAB_COLOR.todo
  const accentColor = tabStyle.color
  const feedBg = tabStyle.bg

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <InlinePublishBox onOpen={() => setPublishOpen(true)} onPublished={handlePublished} />

      <BannerCarousel />

      <ErrorBoundary>
        <FilterBar filters={filters} setFilters={setFilters} />
      </ErrorBoundary>

      {/* Barra de ordenamiento */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] text-ink-400">
          {loading ? '...' : `${posts.filter(p => !blockedUsers.includes(p.author_id)).length} publicaciones`}
        </span>
        <div className="flex bg-white border border-ink-300 rounded-2xl overflow-hidden">
          {SORT_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button key={opt.value} onClick={() => setSort(opt.value)}
                className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  sort === opt.value ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}>
                <Icon size={12} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {newPostsAvailable && (
        <button onClick={loadNewPosts}
          className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium py-2 rounded-2xl mb-2.5">
          <ArrowUp size={13} /> Nuevas publicaciones — toca para ver
        </button>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-[200px]" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="font-medium text-base text-ink-900 mb-1">Sin publicaciones</h3>
          <p className="text-xs text-ink-500 mb-3">No hay publicaciones que coincidan.</p>
          <button onClick={() => setPublishOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-2xl">
            Crear publicación
          </button>
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl p-2 transition-all" style={{ background: feedBg }}>
          {posts.map(post => (
            <PostCard key={post.id} post={post}
              onContact={handleContact}
              accentColor={accentColor}
              contactingId={contactingPost}
              blockedUsers={blockedUsers}
            />
          ))}
          <div ref={sentinel} />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Spinner size={20} className="text-brand-600" />
            </div>
          )}
        </div>
      )}

      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/40"
          onClick={() => setPublishOpen(false)}>
          <div className="w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <PublishBox onClose={() => setPublishOpen(false)} onPublished={handlePublished} />
          </div>
        </div>
      )}

      <PublishSuccessModal open={successOpen} onClose={() => setSuccessOpen(false)}
        onViewMyRequest={() => {
          setSuccessOpen(false)
          if (lastPublishedId) {
            const el = document.getElementById(`post-${lastPublishedId}`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }} />
    </div>
  )
}
