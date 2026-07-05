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
import { getCommunityStats } from '../api/stats'
import { publicName } from '../lib/helpers'
import UserAvatar from '../components/shared/UserAvatar'
import { preloadedFeed } from '../lib/feedPreloader'
import { registerCacheCleaner } from '../lib/cacheManager'

// Cache local — se inicializa desde el preloader si ya tiene datos
const FEED_CACHE_TTL = 3 * 60 * 1000
let _feedCache = preloadedFeed

// Cache de usuarios bloqueados (raramente cambia)
let _blockedCache = null

// Al cerrar sesión, limpiar caches para que el siguiente usuario no vea datos ajenos
registerCacheCleaner(() => {
  _feedCache = { posts: [], ts: 0, filters: '{}', sort: 'smart' }
  _blockedCache = null
})

const SORT_OPTIONS = [
  { value: 'smart',   label: 'Relevante', icon: Sparkles },
  { value: 'recent',  label: 'Reciente',  icon: Clock },
]

function useDebounce(value, ms) {
  const [deb, setDeb] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return deb
}

export default function FeedPage() {
  const { session, profile, loading: authLoading } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('publish') === '1') {
      setPublishOpen(true)
      navigate('/feed', { replace: true })
    }
  }, [location.search, navigate])

  const toast = useToast()

  const [posts,          setPosts         ] = useState(() => {
    // Inicializar con cache si es válido — cero flicker al volver al feed
    const c = _feedCache
    const noFilters = c.filters === '{}' && c.sort === 'smart'
    if (noFilters && c.posts.length > 0 && Date.now() - c.ts < FEED_CACHE_TTL) return c.posts
    return []
  })
  const [loading,        setLoading       ] = useState(posts.length === 0)
  const [loadingMore,    setLoadingMore   ] = useState(false)
  const [hasMore,        setHasMore       ] = useState(true)
  const [filters,        setFilters       ] = useState({})
  const [sort,           setSort          ] = useState('smart')
  const [publishOpen,    setPublishOpen   ] = useState(false)
  const [successOpen,    setSuccessOpen   ] = useState(false)
  const [lastPublishedId,setLastPublishedId] = useState(null)
  const [contactingPost, setContactingPost] = useState(null)
  const [blockedUsers,   setBlockedUsers  ] = useState(_blockedCache || [])
  const [communityStats, setCommunityStats] = useState({ connections: 0, requests: 0, activeThisWeek: 0 })
  const sentinel = useRef(null)

  const debouncedFilters = useDebounce(filters, 400)

  useEffect(() => {
    if (!session?.user?.id) return
    if (_blockedCache) { setBlockedUsers(_blockedCache); return }
    getBlockedUsers(session.user.id).then(list => {
      _blockedCache = list
      setBlockedUsers(list)
    }).catch(() => {})
  }, [session?.user?.id])

  useEffect(() => {
    getCommunityStats().then(setCommunityStats).catch(() => {})
  }, [])

  const fetchPosts = useCallback(async (cursor, append = false) => {
    // Reintento automático: si la primera llamada falla (típico tras recargar
    // cuando el cliente aún está renovando el token), reintenta hasta 2 veces.
    const attempt = async () => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      )
      return Promise.race([
        listPosts({ cursor, limit: 20, filters: debouncedFilters, sort, userId: session?.user?.id }),
        timeout,
      ])
    }

    try {
      let data
      let lastErr
      for (let i = 0; i < 2; i++) {
        try {
          data = await attempt()
          break
        } catch (e) {
          lastErr = e
          if (i < 1) await new Promise(r => setTimeout(r, 600))
        }
      }
      if (data === undefined) throw lastErr || new Error('No se pudo cargar el feed')

      if (append) {
        setPosts(p => [...p, ...data])
      } else {
        setPosts(data)
        const filtersKey = JSON.stringify(debouncedFilters)
        if (filtersKey === '{}' && !cursor) {
          _feedCache = { posts: data, ts: Date.now(), filters: filtersKey, sort }
        }
      }
      setHasMore(data.length === 20)
    } catch (e) {
      // DIAGNÓSTICO: mostrar el error real en pantalla
      const detail = e?.message || e?.error_description || e?.code || JSON.stringify(e).slice(0, 100)
      toast(`Feed falló: ${detail}`, 'error')
      console.error('FEED ERROR COMPLETO:', e)
    }
  }, [debouncedFilters, sort, toast, session?.user?.id])

  useEffect(() => {
    let mounted = true
    // Esperar a que la autenticación termine de resolverse antes de pedir posts.
    // Al recargar, si pedimos posts mientras el token aún se valida, la query
    // se cuelga. Si hay cache, lo mostramos mientras tanto (cero espera visible).
    if (authLoading) return

    const filtersKey = JSON.stringify(debouncedFilters)
    const noFilters  = filtersKey === '{}'
    const cacheValid = noFilters && sort === 'smart'
      && _feedCache.posts.length > 0
      && _feedCache.filters === filtersKey
      && _feedCache.sort === sort
      && (Date.now() - _feedCache.ts < FEED_CACHE_TTL)

    // Si el cache es válido, mostramos el contenido al instante y refrescamos en silencio
    if (!cacheValid) setLoading(true)
    fetchPosts().finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [fetchPosts, debouncedFilters, sort, authLoading])

  const [newPostsAvailable, setNewPostsAvailable] = useState(false)
  useRealtime('posts', 'INSERT', useCallback(() => {
    setNewPostsAvailable(true)
  }, []))

  // Al volver a la pestaña tras estar inactivo, refrescar el feed en silencio.
  // Esto evita ver contenido obsoleto y "revive" la app si el realtime se durmió.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const stale = Date.now() - _feedCache.ts > 60_000
        if (stale) fetchPosts()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchPosts])

  const loadNewPosts = useCallback(() => {
    setNewPostsAvailable(false)
    fetchPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchPosts])

  const stateRef = useRef({ posts, hasMore, loadingMore })
  stateRef.current = { posts, hasMore, loadingMore }

  // Ref a fetchPosts para que el IntersectionObserver no se recree en cada cambio
  const fetchPostsRef = useRef(fetchPosts)
  fetchPostsRef.current = fetchPosts

  useEffect(() => {
    if (!sentinel.current) return
    const obs = new IntersectionObserver(([entry]) => {
      const { posts: ps, hasMore: hm, loadingMore: lm } = stateRef.current
      if (entry.isIntersecting && hm && !lm && ps.length > 0) {
        setLoadingMore(true)
        const cursor = ps[ps.length - 1].created_at
        fetchPostsRef.current(cursor, true).finally(() => setLoadingMore(false))
      }
    }, { rootMargin: '300px' })
    obs.observe(sentinel.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const targetId = location.state?.scrollToPostId
    if (!targetId || loading || posts.length === 0) return
    handleScrollToPost(targetId)
  }, [location.state?.scrollToPostId, loading, posts])

  const handlePublished = (newPost) => {
    setLastPublishedId(newPost?.id || null)
    setPublishOpen(false)
    setSuccessOpen(true)
    // Optimista: el post aparece YA en el feed, sin esperar el refetch de red
    if (newPost?.id) {
      const optimistic = {
        ...newPost,
        profiles: profile || null,
        reaction_count: 0, comment_count: 0, reactions: [],
      }
      setPosts(p => [optimistic, ...p.filter(x => x.id !== newPost.id)])
    }
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
    else setSort('recent')
  }

  const activeTab  = filters.tab || 'todo'
  const tabStyle   = TAB_COLOR[activeTab] || TAB_COLOR.todo
  const accentColor = tabStyle.color
  const feedBg     = tabStyle.bg

  const name = publicName(profile)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="page-enter">
      {/* Layout 3 columnas estilo LinkedIn — solo visible en md+ */}
      <div className="hidden md:flex gap-4 max-w-5xl mx-auto items-start">

        {/* ── Columna izquierda: mini perfil ── */}
        <div className="w-56 flex-shrink-0 sticky top-20 space-y-3">
          {/* Card perfil */}
          <div className="bg-white rounded-2xl overflow-hidden border border-ink-200 shadow-sm">
            {/* Banner */}
            <div className="h-14 w-full" style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a237e 100%)' }} />
            <div className="px-3 pb-4 -mt-7">
              <div className="w-14 h-14 rounded-full border-3 border-white bg-brand-600 flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm" style={{ border: '3px solid white' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-14 h-14 rounded-full object-cover" alt={name} />
                  : <span>{initials}</span>}
              </div>
              <p className="font-bold text-sm text-ink-900 leading-tight">{name}</p>
              {profile?.city && <p className="text-xs text-ink-400 mt-0.5">{profile.city}</p>}
              {profile?.quimica_personaje && (
                <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg" style={{ background: '#f0f2f8' }}>
                  <span className="text-lg">{profile.quimica_personaje}</span>
                  <span className="text-[10px] font-semibold text-ink-500">{profile.quimica_nombre}</span>
                </div>
              )}
              <div className="border-t border-ink-200 mt-3 pt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-400">Publicaciones</span>
                  <span className="font-bold text-ink-900">{communityStats.requests}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-400">Activos esta semana</span>
                  <span className="font-bold text-ink-900">{communityStats.activeThisWeek}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Card juego */}
          <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-3 text-center">
            <p className="text-lg mb-1">🧪</p>
            <p className="text-xs font-bold text-ink-900 mb-0.5">¿Cuánto sabes de ciencias?</p>
            <p className="text-[10px] text-ink-400 mb-2">Mejora tu rango en el feed</p>
            <button onClick={() => window.location.href='/quimica'}
              className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all"
              style={{ background: '#1a237e' }}>
              Jugar ahora →
            </button>
          </div>
        </div>

        {/* ── Columna central: feed ── */}
        <div className="flex-1 min-w-0 space-y-3">
          <InlinePublishBox onOpen={() => setPublishOpen(true)} onPublished={handlePublished} />
          <BannerCarousel />
          <ErrorBoundary><FilterBar filters={filters} setFilters={setFilters} /></ErrorBoundary>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-400">{loading ? '...' : `${posts.filter(p => !blockedUsers.includes(p.author_id)).length} publicaciones`}</span>
            <div className="flex bg-white border border-ink-200 rounded-xl overflow-hidden">
              {SORT_OPTIONS.map(opt => { const Icon = opt.icon; return (
                <button key={opt.value} onClick={() => setSort(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${sort === opt.value ? 'text-white' : 'text-ink-500 hover:bg-ink-50'}`}
                  style={sort === opt.value ? { background: '#1a237e' } : {}}>
                  <Icon size={12} />{opt.label}
                </button>
              )})}
            </div>
          </div>
          {newPostsAvailable && (
            <button onClick={loadNewPosts}
              className="w-full flex items-center justify-center gap-1.5 text-white text-xs font-medium py-2 rounded-xl"
              style={{ background: '#1a237e' }}>
              <ArrowUp size={13} /> Nuevas publicaciones
            </button>
          )}
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-[200px]" />)}</div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-ink-200">
              <h3 className="font-medium text-base text-ink-900 mb-1">Sin publicaciones</h3>
              <p className="text-xs text-ink-400 mb-3">No hay publicaciones que coincidan.</p>
              <button onClick={() => setPublishOpen(true)} className="text-white text-xs font-medium px-4 py-2 rounded-xl" style={{ background: '#1a237e' }}>Crear publicación</button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-ink-200" style={{ background: '#ffffff' }}>
              {posts.filter(p => !blockedUsers.includes(p.author_id)).map((post, idx, arr) => (
                <div key={post.id}>
                  <PostCard post={post} onContact={handleContact} accentColor={accentColor} contactingId={contactingPost} blockedUsers={blockedUsers} />
                  {idx < arr.length - 1 && <div style={{ background: '#ede8e2', height: '5px' }} />}
                </div>
              ))}
              <div ref={sentinel} />
              {loadingMore && <div className="flex justify-center py-4"><Spinner size={20} className="text-brand-600" /></div>}
            </div>
          )}
        </div>

        {/* ── Columna derecha: comunidad ── */}
        <div className="w-52 flex-shrink-0 sticky top-20 space-y-3">
          <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-4">
            <p className="text-xs font-bold text-ink-900 mb-3">La comunidad RODIO</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-400">Total publicaciones</span>
                <span className="text-sm font-black" style={{ color: '#1a237e' }}>{communityStats.requests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-400">Interacciones</span>
                <span className="text-sm font-black" style={{ color: '#1a237e' }}>{communityStats.connections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-400">Activos esta semana</span>
                <span className="text-sm font-black" style={{ color: '#1a237e' }}>{communityStats.activeThisWeek}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-4">
            <p className="text-xs font-bold text-ink-900 mb-3">Top rangos de la comunidad</p>
            <div className="space-y-2">
              {['⚡ Albert Einsteinium', '🌟 Maestro Alquimista', '🎓 PhD en Química', '🏆 Químico Senior', '🧪 Formulador Experto'].map((r, i) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-400">#{i+1}</span>
                  <span className="text-xs text-ink-600">{r}</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.location.href='/quimica'}
              className="w-full mt-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: '#1a237e' }}>
              ¿Cuál es tu rango? →
            </button>
          </div>
        </div>
      </div>

      {/* ── Vista móvil — igual que antes ── */}
      <div className="md:hidden max-w-2xl mx-auto">
      <InlinePublishBox onOpen={() => setPublishOpen(true)} onPublished={handlePublished} />
      <BannerCarousel />

      <ErrorBoundary>
        <FilterBar filters={filters} setFilters={setFilters} />
      </ErrorBoundary>

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
        <div className="rounded-2xl overflow-hidden border border-ink-200" style={{ background: '#ffffff' }}>
          {posts.filter(p => !blockedUsers.includes(p.author_id)).map((post, idx, arr) => (
            <div key={post.id}>
              <PostCard post={post}
                onContact={handleContact}
                accentColor={accentColor}
                contactingId={contactingPost}
                blockedUsers={blockedUsers}
              />
              {idx < arr.length - 1 && (
                <div style={{ background: '#ede8e2', height: '5px' }} />
              )}
            </div>
          ))}
          <div ref={sentinel} />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Spinner size={20} className="text-brand-600" />
            </div>
          )}
        </div>
      )}

      </div>{/* fin md:hidden */}

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
