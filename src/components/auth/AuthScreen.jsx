import { useState, useEffect } from 'react'
import { Gift, Rocket, EyeOff, Lock, MessageCircle, FlaskConical, Users, Handshake, ArrowRight } from 'lucide-react'
import { getCommunityStats } from '../../api/stats'
import CeQuMark from '../shared/CeQuMark'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import ResetForm from './ResetForm'

const ADVANTAGES = [
  { icon: Gift,           text: '100% gratis' },
  { icon: Rocket,         text: 'Registro en segundos' },
  { icon: EyeOff,         text: 'Identidad anónima opcional' },
  { icon: Lock,           text: 'Datos privados' },
  { icon: MessageCircle,  text: 'Chat interno seguro' },
  { icon: FlaskConical,   text: 'Enfoque en industria química' },
]

// Barra superior fija estilo LinkedIn: logo a la izquierda, acciones a la derecha
function TopBar({ onLogin, onSignup }) {
  return (
    <header className="w-full flex-shrink-0" style={{ background: '#ffffff', borderBottom: '1px solid #FFFFFF' }}>
      <div className="max-w-6xl mx-auto h-[70px] flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <CeQuMark size={40} rounded="rounded-lg" />
          <span className="font-extrabold text-xl tracking-wide hidden sm:block" style={{ color: '#111111' }}>CeQu.com</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={onLogin}
            className="px-[18px] py-2.5 rounded-full text-[15px] md:text-[17px] font-semibold transition-colors hover:bg-blue-50"
            style={{ color: '#111111', border: '1.5px solid #111111', background: '#fff' }}>
            Iniciar sesión
          </button>
          <button onClick={onSignup}
            className="px-[18px] py-2.5 rounded-full text-[15px] md:text-[17px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#111111' }}>
            Unirse ahora
          </button>
        </div>
      </div>
    </header>
  )
}

// Landing compacto pensado para caber en una pantalla de PC (~700px de alto útil)
function Landing({ stats, onSignup }) {
  return (
    <div className="flex-1 min-h-0 max-w-6xl w-full mx-auto px-5 py-4 md:py-6 flex flex-col">

      {/* Hero */}
      <section className="flex-shrink-0 md:flex md:items-center md:gap-8">
        <div className="md:flex-1">
          <div className="font-extrabold text-[15px] md:text-[17px] mb-2" style={{ color: '#111111', letterSpacing: '0.5em' }}>
            CEQU
          </div>
          <h1 className="text-[31px] md:text-[46px] font-extrabold leading-tight" style={{ color: '#111111' }}>
            Punto de encuentro<br />
            <span style={{ color: '#2A2A2A' }}>de la industria química.</span>
          </h1>
          <p className="mt-3 text-[16px] md:text-[17px] leading-snug" style={{ color: '#5c6376' }}>
            Conecta con profesionales, laboratorios y proveedores del sector químico en Colombia.
          </p>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-[16px] md:text-[17px] font-bold" style={{ color: '#111111' }}>Conecta</span>
            <span style={{ color: '#D9D9D9', fontSize: 16 }}>·</span>
            <span className="text-[16px] md:text-[17px] font-bold" style={{ color: '#2A2A2A' }}>Comparte</span>
            <span style={{ color: '#D9D9D9', fontSize: 16 }}>·</span>
            <span className="text-[16px] md:text-[17px] font-bold" style={{ color: '#2A2A2A' }}>Crece</span>
          </div>
          <button onClick={onSignup}
            className="mt-4 inline-flex items-center gap-2 px-[26px] py-[13px] rounded-full text-[17px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#111111' }}>
            Unirse ahora <ArrowRight size={22} />
          </button>
        </div>

        {/* Métricas de comunidad */}
        <div className="mt-4 md:mt-0 grid grid-cols-2 gap-3 md:w-[280px] flex-shrink-0">
          <div className="rounded-2xl p-3 text-center" style={{ background: '#111111' }}>
            <div className="flex justify-center mb-1"><Users size={18} color="#8A8A8A" /></div>
            <p className="text-2xl font-extrabold text-white leading-none">{stats.members.toLocaleString('es-CO')}</p>
            <p className="text-[11px] mt-1 uppercase tracking-wider font-medium" style={{ color: '#8A8A8A' }}>Miembros</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: '#111111' }}>
            <div className="flex justify-center mb-1"><FlaskConical size={18} color="#8A8A8A" /></div>
            <p className="text-2xl font-extrabold text-white leading-none">{stats.posts.toLocaleString('es-CO')}</p>
            <p className="text-[11px] mt-1 uppercase tracking-wider font-medium" style={{ color: '#8A8A8A' }}>Publicaciones</p>
          </div>
        </div>
      </section>

      {/* Ventajas — estilo H2 (+10% base, texto +20% adicional) */}
      <section className="mt-3 pt-2.5" style={{ borderTop: '1px solid #FFFFFF' }}>
        <h2 className="text-[13px] font-bold mb-2 tracking-widest" style={{ color: '#111111', letterSpacing: '0.16em' }}>
          ¿POR QUÉ CEQU?
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #EBEBEB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[
              { n: '01', title: 'Gratis',       sub: 'Sin costos ocultos',        navy: true  },
              { n: '02', title: 'Rápido',       sub: 'En segundos',               navy: true  },
              { n: '03', title: 'Anónimo',      sub: 'Opcional',                  navy: true  },
              { n: '04', title: 'Privado',      sub: 'Datos protegidos',          navy: false },
              { n: '05', title: 'Chat seguro',  sub: 'Contacto interno',          navy: false },
              { n: '06', title: 'Química',      sub: 'Industria y lab',           navy: false },
            ].map((item, i) => {
              const isRight   = i % 2 === 1
              const isLastRow = i >= 4
              return (
                <div key={item.n} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 11px',
                  borderBottom: isLastRow ? 'none' : '1px solid #FFFFFF',
                  borderRight:  isRight   ? 'none' : '1px solid #FFFFFF',
                }}>
                  <div style={{
                    fontSize: 25,
                    fontWeight: 900,
                    lineHeight: 1,
                    flexShrink: 0,
                    color: item.navy ? '#111111' : '#2A2A2A',
                  }}>{item.n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111111', lineHeight: 1.15 }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: '#5A5A5A', lineHeight: 1.15 }}>{item.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>


      {/* CTA final */}
      <section className="mt-4 md:mt-5 py-4 text-center rounded-2xl" style={{ background: '#111111' }}>
        <h2 className="text-sm md:text-base font-extrabold text-white px-4">
          Únete a la comunidad química de Colombia
        </h2>
        <button onClick={onSignup}
          className="mt-2 px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: '#2A2A2A', color: '#111111' }}>
          Crear cuenta gratis
        </button>
      </section>
    </div>
  )
}

export default function AuthScreen() {
  const [mode, setMode] = useState('landing') // landing | login | signup | reset
  const [stats, setStats] = useState({ members: 0, posts: 0 })

  useEffect(() => {
    getCommunityStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
      <TopBar onLogin={() => setMode('login')} onSignup={() => setMode('signup')} />

      {mode === 'landing' ? (
        <Landing stats={stats} onSignup={() => setMode('signup')} />
      ) : (
        <div className="flex-1 flex items-start md:items-center justify-center px-4 py-4 md:py-6">
          <div className="w-full max-w-md rounded-3xl p-5 md:p-7 shadow-lg" style={{ background: '#fff', border: '1.5px solid #D9D9D9' }}>
            {mode === 'login' && <LoginForm onSwitchSignup={() => setMode('signup')} onSwitchReset={() => setMode('reset')} />}
            {mode === 'signup' && <SignupForm onSwitchLogin={() => setMode('login')} />}
            {mode === 'reset' && <ResetForm onSwitchLogin={() => setMode('login')} />}
            <button onClick={() => setMode('landing')} className="mt-3 text-xs font-semibold hover:underline" style={{ color: '#111111' }}>
              ← Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
