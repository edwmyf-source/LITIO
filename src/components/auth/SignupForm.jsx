import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { signUp } from '../../api/auth'
import Spinner from '../shared/Spinner'

const ERR_MAP = {
  'User already registered': 'Este email ya está registrado.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 8 caracteres.',
}

// Reglas de contraseña segura
const RULES = [
  { id: 'len',   label: 'Mínimo 8 caracteres',        test: p => p.length >= 8 },
  { id: 'upper', label: 'Una mayúscula',              test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Una minúscula',              test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'Un número',                  test: p => /[0-9]/.test(p) },
  { id: 'sym',   label: 'Un símbolo (!@#$...)',       test: p => /[^A-Za-z0-9]/.test(p) },
]

// Contraseñas comunes que rechazamos explícitamente
const COMMON = ['12345678','password','contrasena','contraseña','qwerty123','abc12345','11111111','cobalto123']

export default function SignupForm({ onSwitchLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const passed    = RULES.filter(r => r.test(pass))
  const isCommon  = COMMON.includes(pass.toLowerCase())
  const strong    = passed.length === RULES.length && !isCommon
  const strength  = isCommon ? 0 : passed.length

  const barColor =
    strength <= 2 ? '#dc2626' :
    strength <= 3 ? '#26282B' :
    strength === 4 ? '#2563C7' : '#16a34a'
  const barLabel =
    isCommon ? 'Muy común, elige otra' :
    strength <= 2 ? 'Débil' :
    strength <= 3 ? 'Media' :
    strength === 4 ? 'Buena' : 'Fuerte'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!strong) {
      setTouched(true)
      setError(isCommon
        ? 'Esa contraseña es demasiado común. Elige una diferente.'
        : 'La contraseña no cumple los requisitos de seguridad.')
      return
    }
    setLoading(true)
    try {
      await signUp(email, pass)
      setSuccess('Revisa tu email para confirmar tu cuenta.')
    } catch (err) {
      setError(ERR_MAP[err.message] || err.message)
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-2xl border border-ink-300 bg-gray-50 text-ink-900 placeholder-ink-400 text-[13px] focus:outline-none focus:border-brand-600 focus:bg-white transition-colors'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg text-ink-900 tracking-tight">Crear cuenta</h2>
        <p className="text-xs mt-0.5 text-ink-500">Te tomará menos de 1 minuto</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-900 mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="tu@empresa.com" className={inputCls} />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-900 mb-1.5">Contraseña</label>
        <input type="password" value={pass}
          onChange={e => { setPass(e.target.value); if (!touched) setTouched(true) }}
          onBlur={() => setTouched(true)}
          required
          placeholder="Crea una contraseña segura" className={inputCls} />

        {/* Barra de fuerza */}
        {pass && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#EEF0F2' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(strength / RULES.length) * 100}%`, background: barColor }} />
              </div>
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: barColor }}>{barLabel}</span>
            </div>

            {/* Checklist de requisitos */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
              {RULES.map(r => {
                const ok = r.test(pass)
                return (
                  <div key={r.id} className="flex items-center gap-1.5">
                    {ok
                      ? <Check size={11} style={{ color: '#16a34a', flexShrink: 0 }} />
                      : <X size={11} style={{ color: '#C2C5C8', flexShrink: 0 }} />}
                    <span className="text-[10px]" style={{ color: ok ? '#16a34a' : '#6E7276' }}>{r.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger-500">{error}</p>}
      {success && <p className="text-xs text-success-500">{success}</p>}

      <button type="submit" disabled={loading || !strong}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium py-2.5 rounded-2xl disabled:opacity-40 transition-colors">
        {loading ? <Spinner size={16} /> : 'Crear cuenta'}
      </button>

      <div className="text-center text-xs pt-4 border-t border-ink-200 text-ink-500">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onSwitchLogin} className="text-brand-600 hover:underline font-medium">
          Iniciar sesión
        </button>
      </div>
    </form>
  )
}
