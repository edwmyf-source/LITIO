import { useState, useMemo } from 'react'
import { Lock, Eye, ShieldCheck, User, Zap, Check, Phone, ArrowRight, MessageCircle } from 'lucide-react'
import { updateProfile } from '../../api/profiles'
import { updatePassword } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'
import { DEPARTAMENTOS, WHATSAPP_VERIFICATION_ENABLED } from '../../lib/constants'
import { signOut } from '../../api/auth'
import { safeErrorMessage } from '../../lib/errors'
import { domainOf, generateIdentityNumber } from '../../lib/helpers'
import PrivacyBadge from '../shared/PrivacyBadge'
import UserAvatar from '../shared/UserAvatar'
import Spinner from '../shared/Spinner'

const inputCls = 'w-full px-3 py-2 rounded-2xl border border-ink-300 text-[13px] focus:outline-none focus:border-brand-600'
const labelCls = 'text-xs font-medium text-ink-900'

export default function ProfileSetup() {
  const { session, profile, setProfile } = useAuth()
  const userId = session?.user?.id || ''
  const userEmail = session?.user?.email || ''
  const defaultNumber = useMemo(() => generateIdentityNumber(userId), [userId])

  // Paso del onboarding: 'phone' (solo teléfono) → 'details' (todo lo demás)
  const [step, setStep] = useState('phone')

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    company_name: profile?.company_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    identity_mode: profile?.identity_mode || 'anon',
    identity_number: profile?.identity_number || defaultNumber,
    password: '',
    wpCode: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Paso 1: el teléfono es obligatorio
  const phoneValid = form.phone.trim().length >= 7

  // Paso 2: validación de los demás campos
  const detailsValid =
    form.full_name.trim() &&
    form.company_name.trim() &&
    form.city &&
    (!WHATSAPP_VERIFICATION_ENABLED || form.wpCode.trim().length > 0)

  const goToDetails = (e) => {
    e.preventDefault()
    if (!phoneValid) { setError('Ingresa un número de teléfono válido.'); return }
    setError('')
    setStep('details')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!detailsValid || loading) return
    setLoading(true)
    setError('')
    try {
      // Si el usuario escribió una contraseña nueva, actualizarla
      if (form.password.trim().length >= 6) {
        await updatePassword(form.password.trim())
      }
      const payload = {
        full_name: form.full_name.trim(),
        company_name: form.company_name.trim(),
        phone: form.phone.trim(),
        city: form.city,
        identity_mode: form.identity_mode,
        identity_number: form.identity_number,
        email_domain: domainOf(userEmail),
        email: userEmail,
      }
      const p = await updateProfile(userId, payload)
      setProfile(p)
    } catch (err) {
      setError(safeErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const IdentityCard = ({ mode, icon, label, preview, anon }) => {
    const active = form.identity_mode === mode
    return (
      <label
        onClick={() => set('identity_mode', mode)}
        className={`flex-1 flex flex-col items-center text-center gap-2 p-3.5 px-2.5 bg-white rounded-2xl cursor-pointer relative ${
          active ? 'border-[1.5px] border-brand-600' : 'border border-ink-300'
        }`}
      >
        {active && (
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center">
            <Check size={9} strokeWidth={3} className="text-white" />
          </span>
        )}
        {anon ? (
          <UserAvatar seed={userId + '-anon'} size={38} />
        ) : (
          <div className="w-[38px] h-[38px] rounded-full bg-ink-100 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-ink-900">{label}</p>
          <p className={`text-[11px] text-ink-900 mt-0.5 font-medium ${anon ? 'font-mono' : ''}`}>
            {preview}
          </p>
        </div>
      </label>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-100 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-ink-300 w-full max-w-md p-7 my-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-2xl bg-brand-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-medium text-sm">Cobalto</span>
        </div>

        {/* ══════════════ PASO 1: TELÉFONO ══════════════ */}
        {step === 'phone' && (
          <form onSubmit={goToDetails}>
            <h2 className="font-medium text-[17px] text-ink-900 tracking-tight mb-1">Verifica tu número</h2>
            <p className="text-xs text-ink-500 mb-5">Lo usamos para confirmar que eres una persona real. Es 100% privado.</p>

            <div className="bg-success-50 border border-success-500/25 rounded-2xl p-2.5 flex gap-2.5 items-start mb-5">
              <Lock size={15} className="text-success-700 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-ink-500 leading-relaxed">
                Tu teléfono es <strong className="text-ink-900 font-medium">100% privado</strong>. Nadie en la comunidad lo verá.
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Teléfono</label>
                <PrivacyBadge variant="private" />
              </div>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  autoFocus
                  value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/[^0-9+ ]/g, '').slice(0, 15))}
                  placeholder="300 123 4567"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <p className="text-[11px] text-ink-500 mt-1">Solo se comparte si tú decides hacerlo dentro del chat.</p>
            </div>

            {error && <p className="text-xs text-danger-500 mb-3">{error}</p>}

            <button type="submit" disabled={!phoneValid}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium py-2.5 rounded-2xl disabled:opacity-50">
              Continuar <ArrowRight size={15} />
            </button>

            <button type="button" onClick={signOut}
              className="w-full text-center text-xs text-ink-500 hover:text-ink-900 py-1 mt-2">
              Cerrar sesión
            </button>
          </form>
        )}

        {/* ══════════════ PASO 2: RESTO DEL PERFIL ══════════════ */}
        {step === 'details' && (
          <>
            <h2 className="font-medium text-[17px] text-ink-900 tracking-tight mb-1">Completa tu perfil</h2>
            <p className="text-xs text-ink-500 mb-4">Solo nosotros sabemos quién eres. La comunidad no.</p>

            <div className="bg-success-50 border border-success-500/25 rounded-2xl p-2.5 flex gap-2.5 items-start mb-5">
              <Lock size={15} className="text-success-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-success-700">Tus datos están protegidos</p>
                <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">
                  Nombre, email, teléfono y empresa son <strong className="text-ink-900 font-medium">100% privados</strong>. Nadie en la comunidad los verá.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3.5">
              {/* Nombre */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Nombre completo</label>
                  <PrivacyBadge variant="private" />
                </div>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  placeholder="Tu nombre" className={inputCls} />
                <p className="text-[11px] text-ink-500 mt-1">Solo lo usamos internamente. Nadie lo verá.</p>
              </div>

              {/* Empresa */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Empresa</label>
                  <PrivacyBadge variant="private" />
                </div>
                <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                  placeholder="Nombre de tu empresa" className={inputCls} />
                <p className="text-[11px] text-ink-500 mt-1">Para nuestros registros. La comunidad nunca lo verá.</p>
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Email</label>
                  <PrivacyBadge variant="private" />
                </div>
                <input value={userEmail} disabled
                  className={`${inputCls} bg-ink-100 text-ink-500`} />
                <p className="text-[11px] text-ink-500 mt-1">Tu email es 100% privado y nunca será visible.</p>
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Contraseña</label>
                  <PrivacyBadge variant="private" />
                </div>
                <input type="password" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Déjalo vacío para no cambiarla" className={inputCls} />
                <p className="text-[11px] text-ink-500 mt-1">Mínimo 6 caracteres. Opcional: solo si quieres establecer una nueva.</p>
              </div>

              {/* Teléfono (ya ingresado, editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Teléfono</label>
                  <PrivacyBadge variant="private" />
                </div>
                <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/[^0-9+ ]/g, '').slice(0, 15))}
                  placeholder="300 123 4567" className={inputCls} />
              </div>

              {/* Código WhatsApp (preparado, opcional por ahora) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls + ' flex items-center gap-1'}>
                    <MessageCircle size={12} className="text-success-700" /> Código de WhatsApp
                  </label>
                  {WHATSAPP_VERIFICATION_ENABLED
                    ? <PrivacyBadge variant="private" />
                    : <span className="text-[10px] text-ink-400 font-medium">Opcional</span>}
                </div>
                <input value={form.wpCode}
                  onChange={e => set('wpCode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="------" inputMode="numeric"
                  className={`${inputCls} tracking-[0.3em] text-center`} />
                <p className="text-[11px] text-brand-700 mt-1 font-medium">Próximamente: confirmación por WhatsApp.</p>
              </div>

              {/* Departamento */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Departamento</label>
                  <PrivacyBadge variant="public" />
                </div>
                <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <p className="text-[11px] text-brand-700 mt-1 font-medium">La comunidad lo verá para coordinar logística y envíos.</p>
              </div>

              {/* Identidad pública */}
              <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-3">
                <div className="flex items-start gap-2 mb-3">
                  <Eye size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-ink-900">¿Cómo te identifica la comunidad?</p>
                    <p className="text-[10px] text-ink-500 mt-0.5">Lo único público. Puedes cambiarlo cuando quieras.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <IdentityCard
                    mode="anon"
                    label="Anónimo"
                    preview={`Usuario-${form.identity_number}`}
                    anon
                  />
                  <IdentityCard
                    mode="real"
                    icon={<User size={22} className="text-ink-500" />}
                    label="Mi nombre"
                    preview={form.full_name || 'Tu nombre'}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-danger-500">{error}</p>}

              <button type="submit" disabled={!detailsValid || loading}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium py-2.5 rounded-2xl disabled:opacity-50">
                {loading ? <Spinner size={16} /> : 'Guardar y continuar'}
              </button>

              <p className="text-center text-[10px] text-ink-500 leading-relaxed flex items-center justify-center gap-1">
                <ShieldCheck size={11} className="text-success-700" />
                Al continuar aceptas nuestra <a href="#" className="text-brand-600 hover:underline">política de privacidad</a>.
              </p>

              <button type="button" onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-ink-500 hover:text-ink-900 py-1">
                ← Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
