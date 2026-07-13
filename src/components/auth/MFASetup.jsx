import { useState, useEffect, useRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import { listMFAFactors, challengeMFA, verifyMFALogin } from '../../api/auth'
import Spinner from '../shared/Spinner'

export default function MFAVerifyForm({ onSuccess, onCancel }) {
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [factorId, setFactorId] = useState(null)
  const [challengeId, setChallengeId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Obtener el factor y crear challenge automáticamente
    listMFAFactors().then(async (factors) => {
      if (!factors.length) { onSuccess?.(); return }
      const fid = factors[0].id
      setFactorId(fid)
      const ch = await challengeMFA(fid)
      setChallengeId(ch.id)
    }).catch((e) => setError(e.message))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!factorId || !challengeId) return
    setError('')
    setLoading(true)
    try {
      await verifyMFALogin(factorId, challengeId, code.trim())
      onSuccess?.()
    } catch {
      setError('Código incorrecto. Verifica tu app de autenticación.')
      setCode('')
      inputRef.current?.focus()
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-3 rounded-2xl border border-ink-300 text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:border-brand-600'

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2 mb-2">
        <div className="w-12 h-12 rounded-full bg-brand-600/10 flex items-center justify-center">
          <ShieldCheck size={24} className="text-brand-600" />
        </div>
        <h2 className="font-medium text-lg text-ink-900 tracking-tight">Verificación en dos pasos</h2>
        <p className="text-xs text-ink-500 max-w-xs">
          Abre Google Authenticator o Authy e ingresa el código de 6 dígitos de <strong>Cobalto</strong>.
        </p>
      </div>

      <div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className={inputCls}
          autoComplete="one-time-code"
        />
      </div>

      {error && <p className="text-xs text-danger-500 text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading || code.length !== 6 || !challengeId}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium py-2.5 rounded-2xl disabled:opacity-50"
      >
        {loading ? <Spinner size={16} /> : 'Verificar'}
      </button>

      <div className="text-center">
        <button type="button" onClick={onCancel} className="text-xs text-ink-500 hover:underline">
          Cancelar e iniciar sesión con otra cuenta
        </button>
      </div>
    </form>
  )
}
