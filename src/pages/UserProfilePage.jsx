import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, UserPlus, UserCheck, MessageCircle, Send, Loader2, Settings, Camera } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicProfile, uploadAvatar, uploadCover, updateProfile } from '../api/profiles'
import { getPostsByUser } from '../api/posts'
import { followUser, unfollowUser, checkIsFollowing, getFollowCounts } from '../api/follows'
import { getOrCreateConversation } from '../api/messages'
import { createNotification } from '../api/notifications'
import { publicName, timeAgo } from '../lib/helpers'
import { CATEGORY_MAP } from '../lib/constants'
import UserAvatar from '../components/shared/UserAvatar'
import Spinner from '../components/shared/Spinner'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'

function MiniPostCard({ post, onContact, contactingId }) {
  const { session } = useAuth()
  const isMine = post.author_id === session?.user?.id
  const catLabel = CATEGORY_MAP[post.category]?.label || post.category
  const wallText = [post.title, post.content].filter(Boolean).join('\n\n')
  const isContacting = contactingId === post.id

  return (
    <div className="bg-white border border-ink-200 rounded-xl px-3.5 py-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-2">
        {catLabel && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 leading-none">
            {catLabel}
          </span>
        )}
        <span className="text-[10px] text-ink-400 ml-auto">{timeAgo(post.created_at)}</span>
      </div>
      <p className="text-[13px] text-ink-800 leading-relaxed mb-2.5 whitespace-pre-wrap break-words line-clamp-4">
        {wallText}
      </p>
      <div className="flex items-center justify-between pt-2 border-t border-ink-100">
        <div className="flex items-center gap-3 text-[11px] text-ink-400">
          <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comment_count || 0}</span>
        </div>
        {!isMine && (
          <button onClick={() => onContact?.(post)} disabled={isContacting}
            className="flex items-center gap-1 text-[11px] bg-brand-600 hover:bg-brand-700 text-white font-medium px-2.5 py-1 rounded-lg disabled:opacity-60 transition-all">
            {isContacting ? <><Loader2 size={11} className="animate-spin" /> Abriendo...</> : <><Send size={11} /> Contactar</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate   = useNavigate()
  const { session, profile: myProfile, setProfile: setMyProfile } = useAuth()
  const toast      = useToast()
  const myId       = session?.user?.id

  const [profile, setProfile]             = useState(null)
  const [posts, setPosts]                 = useState([])
  const [counts, setCounts]               = useState({ followers: 0, following: 0 })
  const [isFollowing, setIsFollowing]     = useState(false)
  const [loadingPage, setLoadingPage]     = useState(true)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [contactingPost, setContactingPost] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover]   = useState(false)

  const avatarInputRef = useRef(null)
  const coverInputRef  = useRef(null)

  const isOwnProfile = myId === userId

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const [prof, userPosts, followCounts] = await Promise.all([
        getPublicProfile(userId),
        getPostsByUser(userId, { limit: 30 }),
        getFollowCounts(userId),
      ])
      setProfile(prof)
      setPosts(userPosts)
      setCounts(followCounts)
      if (myId && !isOwnProfile) {
        const following = await checkIsFollowing(myId, userId)
        setIsFollowing(following)
      }
    } catch (e) {
      toast(safeErrorMessage(e), 'error')
    } finally {
      setLoadingPage(false)
    }
  }, [userId, myId, isOwnProfile, toast])

  useEffect(() => { load() }, [load])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('La foto no puede superar 5 MB', 'error'); return }
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(myId, file)
      setProfile(p => ({ ...p, avatar_url: url }))
      // Sincronizar con el perfil global del contexto
      const updated = await updateProfile(myId, {
        full_name: myProfile?.full_name, company_name: myProfile?.company_name,
        phone: myProfile?.phone, city: myProfile?.city,
        identity_mode: myProfile?.identity_mode, identity_number: myProfile?.identity_number,
        email: session?.user?.email, avatar_url: url,
      })
      setMyProfile(updated)
    } catch (err) { toast(safeErrorMessage(err), 'error') }
    setUploadingAvatar(false)
    e.target.value = ''
  }

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast('La portada no puede superar 10 MB', 'error'); return }
    setUploadingCover(true)
    try {
      const url = await uploadCover(myId, file)
      setProfile(p => ({ ...p, cover_url: url }))
      await updateProfile(myId, {
        full_name: myProfile?.full_name, company_name: myProfile?.company_name,
        phone: myProfile?.phone, city: myProfile?.city,
        identity_mode: myProfile?.identity_mode, identity_number: myProfile?.identity_number,
        email: session?.user?.email, cover_url: url,
      })
    } catch (err) { toast(safeErrorMessage(err), 'error') }
    setUploadingCover(false)
    e.target.value = ''
  }

  const handleFollow = async () => {
    if (!myId || loadingFollow) return
    setLoadingFollow(true)
    try {
      if (isFollowing) {
        await unfollowUser(myId, userId)
        setIsFollowing(false)
        setCounts(c => ({ ...c, followers: Math.max(0, c.followers - 1) }))
      } else {
        await followUser(myId, userId)
        setIsFollowing(true)
        setCounts(c => ({ ...c, followers: c.followers + 1 }))
        createNotification({ user_id: userId, from_user_id: myId, type: 'follow', content: 'comenzó a seguirte' })
      }
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setLoadingFollow(false)
  }

  const handleContact = useCallback(async (post) => {
    if (contactingPost) return
    setContactingPost(post.id)
    try {
      const conv = await getOrCreateConversation(myId, post.author_id, post.id)
      if (post.author_id !== myId) {
        createNotification({
          user_id: post.author_id, from_user_id: myId,
          type: 'message',
          content: `quiere contactarte sobre "${post.title?.slice(0, 50)}"`,
          post_id: post.id,
        })
      }
      navigate('/chats', { state: { convId: conv.id } })
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setContactingPost(null)
  }, [myId, navigate, toast, contactingPost])

  if (loadingPage) {
    return <div className="flex items-center justify-center py-20"><Spinner size={28} className="text-brand-600" /></div>
  }
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-ink-500 text-sm">Perfil no encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-600 text-sm hover:underline">Volver</button>
      </div>
    )
  }

  const displayName = publicName(profile)
  const coverUrl    = profile.cover_url || null

  return (
    <div className="page-enter max-w-xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-ink-500 hover:text-ink-800 text-[13px] mb-3 transition-colors">
        <ArrowLeft size={15} /> Volver
      </button>

      {/* Tarjeta de perfil */}
      <div className="rounded-2xl overflow-hidden border border-ink-200 mb-3">

        {/* ── Portada ── */}
        <div className="relative" style={{ height: 120 }}>
          {coverUrl
            ? <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-r from-violet-900 via-brand-600 to-violet-500" />
          }
          {/* Overlay de carga */}
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
          {/* Botón cambiar portada — solo en perfil propio */}
          {isOwnProfile && (
            <>
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                aria-label="Cambiar portada">
                <Camera size={13} /> Cambiar portada
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </>
          )}
        </div>

        {/* ── Avatar + acciones ── */}
        <div className="bg-white px-4 pb-4">
          <div className="flex items-end justify-between -mt-8 mb-3">
            {/* Avatar clickeable en perfil propio */}
            <div className="relative flex-shrink-0">
              <div
                className="border-[3px] border-white rounded-full"
                onClick={isOwnProfile ? () => avatarInputRef.current?.click() : undefined}
                style={isOwnProfile ? { cursor: 'pointer' } : {}}>
                {uploadingAvatar ? (
                  <div style={{ width: 64, height: 64 }}
                    className="rounded-full bg-ink-200 flex items-center justify-center">
                    <Loader2 size={20} className="text-brand-600 animate-spin" />
                  </div>
                ) : (
                  <UserAvatar seed={profile.id} avatarUrl={profile.avatar_url} size={64} />
                )}
              </div>
              {/* Ícono cámara encima del avatar */}
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center hover:bg-brand-700 transition-colors disabled:opacity-50"
                  aria-label="Cambiar foto de perfil">
                  <Camera size={11} className="text-white" />
                </button>
              )}
              {isOwnProfile && (
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              )}
            </div>

            {isOwnProfile ? (
              <button onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 text-[12px] font-medium px-4 py-1.5 border border-ink-300 rounded-full text-ink-700 hover:bg-ink-50 transition-colors">
                <Settings size={13} /> Configuración
              </button>
            ) : (
              <button onClick={handleFollow} disabled={loadingFollow}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-1.5 rounded-full transition-all disabled:opacity-60 ${
                  isFollowing
                    ? 'border border-brand-600 text-brand-600 bg-white hover:bg-brand-50'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}>
                {loadingFollow
                  ? <Spinner size={13} />
                  : isFollowing
                    ? <><UserCheck size={13} /> Siguiendo</>
                    : <><UserPlus size={13} /> Seguir</>
                }
              </button>
            )}
          </div>

          <p className="text-[16px] font-bold text-ink-900 leading-tight">{displayName}</p>
          {profile.company_name && <p className="text-[12px] text-ink-500 mt-0.5">{profile.company_name}</p>}
          {profile.city && (
            <p className="flex items-center gap-1 text-[11px] text-ink-400 mt-1">
              <MapPin size={11} /> {profile.city}
            </p>
          )}

          <div className="flex gap-5 mt-3 pt-3 border-t border-ink-100">
            <div><span className="text-[15px] font-bold text-ink-900">{counts.followers}</span><span className="text-[11px] text-ink-400 ml-1">Seguidores</span></div>
            <div><span className="text-[15px] font-bold text-ink-900">{counts.following}</span><span className="text-[11px] text-ink-400 ml-1">Siguiendo</span></div>
            <div><span className="text-[15px] font-bold text-ink-900">{posts.length}</span><span className="text-[11px] text-ink-400 ml-1">Publicaciones</span></div>
          </div>
        </div>
      </div>

      <h3 className="text-[12px] font-semibold text-ink-500 uppercase tracking-wider mb-2.5">Publicaciones</h3>
      {posts.length === 0 ? (
        <div className="text-center py-12 text-ink-400 text-sm">Sin publicaciones aún.</div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <MiniPostCard key={post.id} post={post} onContact={handleContact} contactingId={contactingPost} />
          ))}
        </div>
      )}
    </div>
  )
}
