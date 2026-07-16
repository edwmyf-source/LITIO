import { useState, useEffect } from 'react'
import { Mail, KeyRound } from 'lucide-react'
import { signIn, signInWithMagicLink } from '../../api/auth'
import Spinner from '../shared/Spinner'

const ERR_MAP = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Confirma tu email antes de iniciar sesión.',
}

const LAST_EMAIL_KEY = 'cobalto-last-email'

export default function LoginForm({ onSwitchSignup, onSwitchReset }) {
  const [mode, setMode]     = useState('password') // 'password' | 'magic'
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)

  // Recuerda el último email usado para no volver a escribirlo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_EMAIL_KEY)
      if (saved) setEmail(saved)
    } catch {}
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email)
        setSent(true)
      } else {
        await signIn(email, pass)
      }
      try { localStorage.setItem(LAST_EMAIL_KEY, email) } catch {}
    } catch (err) {
      setError(ERR_MAP[err.message] || err.message)
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-2xl border border-ink-300 bg-gray-50 text-ink-900 placeholder-ink-400 text-[13px] focus:outline-none focus:border-brand-600 focus:bg-white transition-colors'

  if (sent) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: '#EDF3FB' }}>
          <Mail size={22} style={{ color: '#001A3D' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-ink-900 tracking-tight">Revisa tu correo</h2>
          <p className="text-xs mt-1.5 text-ink-500 leading-relaxed">
            Enviamos un enlace de acceso a<br />
            <span className="font-semibold" style={{ color: '#001A3D' }}>{email}</span>
          </p>
          <p className="text-[11px] mt-2 text-ink-400">Tócalo desde este mismo dispositivo para entrar.</p>
        </div>
        <button type="button" onClick={() => { setSent(false); setMode('password') }}
          className="text-xs text-brand-600 hover:underline font-medium">
          ← Usar contraseña
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg text-ink-900 tracking-tight">Iniciar sesión</h2>
        <p className="text-xs mt-0.5 text-ink-500">Bienvenido de vuelta</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-900 mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="tu@empresa.com" className={inputCls} autoComplete="email" />
      </div>

      {mode === 'password' && (
        <div>
          <label className="block text-xs font-medium text-ink-900 mb-1.5">Contraseña</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
            placeholder="••••••••" className={inputCls} autoComplete="current-password" />
          <button type="button" onClick={onSwitchReset} className="text-xs text-brand-600 hover:underline mt-2 inline-block">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      )}

      {error && <p className="text-xs text-danger-500">{error}</p>}

      <button type="submit" disabled={loading || !email}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium py-2.5 rounded-2xl disabled:opacity-50 transition-colors">
        {loading ? <Spinner size={16} /> : mode === 'magic' ? 'Enviar enlace de acceso' : 'Entrar'}
      </button>

      {/* Cambiar entre contraseña y enlace mágico */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px" style={{ background: '#DDE7F4' }} />
        <span className="text-[10px] font-medium" style={{ color: '#B8C9E0' }}>o</span>
        <div className="flex-1 h-px" style={{ background: '#DDE7F4' }} />
      </div>

      <button type="button"
        onClick={() => { setMode(m => m === 'magic' ? 'password' : 'magic'); setError('') }}
        className="w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-2xl transition-colors"
        style={{ border: '1.5px solid #CDDBEC', color: '#001A3D', background: '#fff' }}>
        {mode === 'magic'
          ? <><KeyRound size={15} /> Entrar con contraseña</>
          : <><Mail size={15} /> Entrar solo con mi email</>}
      </button>

      <div className="text-center text-xs pt-4 border-t border-ink-200 text-ink-500">
        ¿Sin cuenta?{' '}
        <button type="button" onClick={onSwitchSignup} className="text-brand-600 hover:underline font-medium">
          Crear cuenta
        </button>
      </div>
    </form>
  )
}
