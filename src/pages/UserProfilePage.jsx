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
    <div className="page-enter max-w-xl mx-auto px-1">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-[14px] font-medium mb-4 transition-colors">
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Tarjeta de perfil premium */}
      <div className="rounded-3xl overflow-hidden mb-5" style={{ boxShadow: '0 12px 36px rgba(0,71,171,0.18)' }}>

        {/* ── Portada degradada ── */}
        <div className="relative" style={{ height: 150 }}>
          {coverUrl
            ? <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0047AB 0%, #2C6BD4 70%, #4C82F0 100%)' }} />
          }
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
          {isOwnProfile && (
            <>
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-[12px] font-medium px-3.5 py-2 rounded-full transition-colors disabled:opacity-50 backdrop-blur-sm"
                aria-label="Cambiar portada">
                <Camera size={14} /> Cambiar portada
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </>
          )}
        </div>

        {/* ── Avatar + acciones ── */}
        <div className="bg-white px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative flex-shrink-0">
              <div
                className="border-4 border-white rounded-[28px] overflow-hidden"
                onClick={isOwnProfile ? () => avatarInputRef.current?.click() : undefined}
                style={isOwnProfile ? { cursor: 'pointer' } : {}}>
                {uploadingAvatar ? (
                  <div style={{ width: 92, height: 92 }}
                    className="rounded-[24px] bg-gray-100 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin" style={{ color: '#0047AB' }} />
                  </div>
                ) : (
                  <UserAvatar seed={profile.id} avatarUrl={profile.avatar_url} size={92} className="!rounded-[24px]" />
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center transition-colors disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#0047AB,#2C6BD4)' }}
                  aria-label="Cambiar foto de perfil">
                  <Camera size={14} className="text-white" />
                </button>
              )}
              {isOwnProfile && (
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              )}
            </div>

            {isOwnProfile ? (
              <button onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 text-[14px] font-semibold px-5 h-11 rounded-2xl text-gray-700 transition-colors active:scale-95"
                style={{ border: '1px solid #E5E7EB', background: '#fff' }}>
                <Settings size={16} /> Editar
              </button>
            ) : (
              <button onClick={handleFollow} disabled={loadingFollow}
                className="flex items-center gap-1.5 text-[14px] font-semibold px-6 h-11 rounded-2xl transition-all disabled:opacity-60 active:scale-95"
                style={isFollowing
                  ? { border: '1px solid #0047AB', color: '#0047AB', background: '#fff' }
                  : { background: 'linear-gradient(135deg,#0047AB,#2C6BD4)', color: '#fff', boxShadow: '0 8px 20px rgba(0,71,171,0.3)' }}>
                {loadingFollow
                  ? <Spinner size={15} />
                  : isFollowing
                    ? <><UserCheck size={16} /> Siguiendo</>
                    : <><UserPlus size={16} /> Seguir</>
                }
              </button>
            )}
          </div>

          <p className="text-[22px] font-extrabold text-[#0A2A5C] leading-tight" style={{ letterSpacing: '-0.02em' }}>{displayName}</p>
          {profile.company_name && <p className="text-[15px] text-gray-500 mt-0.5">{profile.company_name}</p>}
          {profile.city && (
            <p className="flex items-center gap-1 text-[14px] text-gray-400 mt-1.5">
              <MapPin size={14} /> {profile.city}
            </p>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-2xl py-4 text-center" style={{ background: '#F4F7FD' }}>
              <div className="text-[22px] font-extrabold text-[#0A2A5C]" style={{ letterSpacing: '-0.02em' }}>{posts.length}</div>
              <div className="text-[12px] text-gray-500 mt-0.5 font-medium">Publicaciones</div>
            </div>
            <div className="rounded-2xl py-4 text-center" style={{ background: '#F4F7FD' }}>
              <div className="text-[22px] font-extrabold text-[#0A2A5C]" style={{ letterSpacing: '-0.02em' }}>{counts.followers}</div>
              <div className="text-[12px] text-gray-500 mt-0.5 font-medium">Seguidores</div>
            </div>
            <div className="rounded-2xl py-4 text-center" style={{ background: '#F4F7FD' }}>
              <div className="text-[22px] font-extrabold text-[#0A2A5C]" style={{ letterSpacing: '-0.02em' }}>{counts.following}</div>
              <div className="text-[12px] text-gray-500 mt-0.5 font-medium">Siguiendo</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-[10px] font-extrabold uppercase mb-3 px-2" style={{ color: '#5578AD', letterSpacing: '0.12em' }}>Publicaciones</h3>
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-[15px]">Sin publicaciones aún.</div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <MiniPostCard key={post.id} post={post} onContact={handleContact} contactingId={contactingPost} />
          ))}
        </div>
      )}
    </div>
  )
}
