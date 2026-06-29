import { useState, useEffect, useRef } from 'react'
import { ThumbsUp, PartyPopper, Eye, Heart, Sparkles } from 'lucide-react'
import { toggleReaction, getReactionsForPost } from '../../api/reactions'
import { createNotification } from '../../api/notifications'
import { REACTIONS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'

const REACTION_ICONS = { thumbsup: ThumbsUp, partypopper: PartyPopper, eye: Eye, heart: Heart, sparkles: Sparkles }

const REACTION_COLORS = {
  like:      { bg: '#ede9fe', border: '#7c3aed', icon: '#7c3aed', count: '#7c3aed' },
  celebrate: { bg: '#fef9c3', border: '#ca8a04', icon: '#ca8a04', count: '#ca8a04' },
  curious:   { bg: '#e0f2fe', border: '#0284c7', icon: '#0284c7', count: '#0284c7' },
  love:      { bg: '#fce7f3', border: '#ec4899', icon: '#ec4899', count: '#ec4899' },
  surprised: { bg: '#fef3c7', border: '#d97706', icon: '#d97706', count: '#d97706' },
}
const INACTIVE = { bg: '#f3f4f6', border: 'transparent', icon: '#9ca3af', count: '#9ca3af' }

function parseReactions(data, userId) {
  const c = {}
  const mine = new Set()
  data.forEach(r => {
    c[r.type] = (c[r.type] || 0) + 1
    if (r.user_id === userId) mine.add(r.type)
  })
  return { counts: c, myReactions: mine }
}

export default function ReactionBar({ post, initialReactions = null }) {
  const { session } = useAuth()
  const userId = session?.user?.id
  const [counts, setCounts] = useState({})
  const [myReactions, setMyReactions] = useState(new Set())
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (initialReactions !== null) {
      const { counts: c, myReactions: m } = parseReactions(initialReactions, userId)
      setCounts(c)
      setMyReactions(m)
    } else {
      getReactionsForPost(post.id).then(data => {
        const { counts: c, myReactions: m } = parseReactions(data, userId)
        setCounts(c)
        setMyReactions(m)
      }).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReaction = async (type) => {
    try {
      const wasActive = myReactions.has(type)
      setCounts(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) + (wasActive ? -1 : 1)) }))
      setMyReactions(prev => {
        const next = new Set(prev)
        wasActive ? next.delete(type) : next.add(type)
        return next
      })
      const result = await toggleReaction(post.id, userId, type)
      if (result.action === 'added' && post.author_id !== userId) {
        const label = REACTIONS.find(r => r.type === type)?.label || type
        createNotification({
          user_id: post.author_id, from_user_id: userId,
          type: 'reaction',
          content: `reaccionó con "${label}" a tu publicación`,
          post_id: post.id,
        })
      }
    } catch (e) { console.error('Reaction error:', e) }
  }

  return (
    <div className="mb-1.5">
      <div className="flex gap-1.5 flex-wrap">
        {REACTIONS.map(reaction => {
          const count = counts[reaction.type] || 0
          const isActive = myReactions.has(reaction.type)
          const Icon = REACTION_ICONS[reaction.icon]
          const clr = isActive ? REACTION_COLORS[reaction.type] || INACTIVE : INACTIVE
          return (
            <button key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              title={reaction.label}
              className="flex items-center gap-1.5 rounded-full transition-all"
              style={{
                padding: '5px 10px',
                background: clr.bg,
                border: `1.5px solid ${clr.border}`,
              }}>
              <Icon size={20} style={{ color: clr.icon, flexShrink: 0 }} />
              {count > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: clr.count, lineHeight: 1 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
