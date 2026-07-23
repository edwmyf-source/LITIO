import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, MessageSquareText, Loader2 } from 'lucide-react'
import { searchUsers } from '../api/users'
import { getOrCreateConversation, sendMessage } from '../api/messages'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/shared/Toast'
import { safeErrorMessage } from '../lib/errors'
import { publicName } from '../lib/helpers'
import UserAvatar from '../components/shared/UserAvatar'
import Spinner from '../components/shared/Spinner'

export default function ContactsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactingId, setContactingId] = useState(null)
  const debounceRef = useRef(null)

  const runSearch = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = await searchUsers(session.user.id, q)
      setUsers(data)
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setLoading(false)
  }, [session?.user?.id, toast])

  useEffect(() => { runSearch('') }, [runSearch])

  const handleQueryChange = (v) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(v), 350)
  }

  const handleStartChat = async (user) => {
    if (contactingId) return
    setContactingId(user.id)
    try {
      const conv = await getOrCreateConversation(session.user.id, user.id, null)
      navigate('/chats', { state: { convId: conv.id } })
    } catch (e) { toast(safeErrorMessage(e), 'error') }
    setContactingId(null)
  }

  return (
    <div className="page-enter max-w-lg mx-auto px-1">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-[14px] font-medium mb-4 transition-colors">
        <ArrowLeft size={16} /> Volver
      </button>

      <h2 className="font-extrabold text-[28px] text-[#0A2A5C] mb-1" style={{ letterSpacing: '-0.03em' }}>Contactos</h2>
      <p className="text-[15px] text-gray-500 mb-5">Busca a cualquier persona registrada y escríbele directamente.</p>

      <div className="flex items-center gap-2.5 px-4 h-14 rounded-[18px] mb-5"
        style={{ background: '#ffffff', boxShadow: '0 6px 20px rgba(0,71,171,0.08)' }}>
        <Search size={18} color="#9CA3AF" />
        <input
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Buscar por nombre, empresa o ciudad..."
          className="flex-1 bg-transparent text-[16px] focus:outline-none"
          style={{ color: '#0A2A5C' }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={22} /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-[15px]">No se encontraron personas.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {users.map(user => {
            const isContacting = contactingId === user.id
            return (
              <div key={user.id} className="flex items-center gap-3 bg-white rounded-2xl p-3.5"
                style={{ boxShadow: '0 6px 20px rgba(0,71,171,0.08)' }}>
                <UserAvatar seed={user.id} avatarUrl={user.avatar_url} size={44} />
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/u/${user.id}`)}>
                  <p className="text-[15px] font-extrabold text-[#0A2A5C] truncate">{publicName(user)}</p>
                  <p className="text-[13px] text-gray-500 truncate">
                    {[user.company_name, user.city].filter(Boolean).join(' · ') || 'Sin más información'}
                  </p>
                </div>
                <button onClick={() => handleStartChat(user)} disabled={isContacting} aria-label="Enviar mensaje"
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#0047AB,#2C6BD4)', color: '#fff', boxShadow: '0 4px 12px rgba(0,71,171,0.25)' }}>
                  {isContacting ? <Loader2 size={18} className="animate-spin" /> : <MessageSquareText size={18} />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
