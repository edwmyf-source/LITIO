import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../api/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── 15 PERSONAJES ────────────────────────────────────────────────────────────
const PERSONAJES = [
  { id: 0,  min: 0,    emoji: '🌱', nombre: 'Semilla Curiosa',       desc: 'Apenas descubre que la química existe.', color: '#e65100', bg: '#fff3e0' },
  { id: 1,  min: 50,   emoji: '🧒', nombre: 'Niño Preguntón',         desc: '¿Por qué todo explota si lo mezclas?',  color: '#880e4f', bg: '#fce4ec' },
  { id: 2,  min: 120,  emoji: '📓', nombre: 'Estudiante de Bachiller', desc: 'Memorizó la tabla periódica. Una vez.', color: '#1b5e20', bg: '#e8f5e9' },
  { id: 3,  min: 220,  emoji: '🎒', nombre: 'Preuniversitario',        desc: 'Sabe escribir H₂O sin buscarla.',       color: '#0d47a1', bg: '#e3f2fd' },
  { id: 4,  min: 350,  emoji: '📚', nombre: 'Universitario Primer Año', desc: 'Sobrevivió química general. Casi.',    color: '#4a148c', bg: '#f3e5f5' },
  { id: 5,  min: 520,  emoji: '⚗️',  nombre: 'Practicante de Lab',     desc: 'Ya no rompe pipetas. Casi nunca.',     color: '#006064', bg: '#e0f7fa' },
  { id: 6,  min: 720,  emoji: '🔬', nombre: 'Técnico Analítico',       desc: 'Lee una ficha técnica y entiende todo.', color: '#e65100', bg: '#fff8e1' },
  { id: 7,  min: 960,  emoji: '👩‍🔬', nombre: 'Laboratorista Senior',  desc: 'Sabe cuándo la reacción va mal.',      color: '#2F80ED', bg: '#F2F7FF' },
  { id: 8,  min: 1250, emoji: '🧪', nombre: 'Formulador Experto',      desc: 'Huele el reactivo y ya sabe qué es.',  color: '#880e4f', bg: '#fce4ec' },
  { id: 9,  min: 1600, emoji: '👨‍🏫', nombre: 'Profe Labortosita',      desc: 'Explica lo mismo 40 veces. Con amor.', color: '#1b5e20', bg: '#e8f5e9' },
  { id: 10, min: 2000, emoji: '🧫', nombre: 'Investigador',             desc: 'Publica papers. Nadie los lee. Importan.', color: '#0d47a1', bg: '#e3f2fd' },
  { id: 11, min: 2500, emoji: '🏆', nombre: 'Químico Senior',           desc: 'Ha visto explosiones no documentadas.', color: '#4a148c', bg: '#f3e5f5' },
  { id: 12, min: 3100, emoji: '🎓', nombre: 'PhD en Química',           desc: 'Cinco años de tesis para llegar aquí.', color: '#e65100', bg: '#fff3e0' },
  { id: 13, min: 3800, emoji: '🌟', nombre: 'Maestro Alquimista',       desc: 'Convierte el plomo en oro... casi.',    color: '#006064', bg: '#e0f7fa' },
  { id: 14, min: 4600, emoji: '⚡', nombre: 'Albert Einsteinium',       desc: 'E=mc². Y sabe exactamente por qué.',   color: '#f57f17', bg: '#fffde7' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getPersonaje(pts) {
  let p = PERSONAJES[0]
  for (const per of PERSONAJES) { if (pts >= per.min) p = per }
  return p
}

// ─── 20 NIVELES TEMÁTICOS (sincronizados con tabla quiz_preguntas en Supabase) ─
const NIVELES = [
  { id: 1,  tema: 'La vida y los seres vivos',    emoji: '🌱', color: '#16a34a', bg: '#f0fdf4', frase_inicio: '¡Vamos calentando motores!', frase_nivel: '¡Arrancamos!' },
  { id: 2,  tema: 'El cuerpo humano',             emoji: '🫀', color: '#0d9488', bg: '#f0fdfa', frase_inicio: '¿Conoces tu propio cuerpo?', frase_nivel: '¡Subiste de nivel! 🚀' },
  { id: 3,  tema: 'Naturaleza y planeta Tierra',  emoji: '🌎', color: '#2563eb', bg: '#eff6ff', frase_inicio: '¡Vas bien, sigue así!', frase_nivel: '¡Nivel 3! ¡Se pone bueno!' },
  { id: 4,  tema: 'Física: movimiento y fuerzas', emoji: '🚀', color: '#7c3aed', bg: '#f5f3ff', frase_inicio: 'Aquí empieza lo serio...', frase_nivel: '¡Nivel 4! ¡Eso es!' },
  { id: 5,  tema: 'Física: energía y luz',        emoji: '💡', color: '#dc2626', bg: '#fff1f2', frase_inicio: '¡Que se haga la luz!', frase_nivel: '¡NIVEL 5! 🔥 ¡Fuego!' },
  { id: 6,  tema: 'Química básica',               emoji: '⚛️', color: '#ea580c', bg: '#fff7ed', frase_inicio: 'Los átomos no mienten', frase_nivel: '¡Nivel 6! ¡Imparable!' },
  { id: 7,  tema: 'Mezclas y soluciones',         emoji: '🧫', color: '#0369a1', bg: '#f0f9ff', frase_inicio: '¿Soluto o solvente? Eso te pregunto', frase_nivel: '¡NIVEL 7! ¡Qué bestia!' },
  { id: 8,  tema: 'Ácidos y bases',               emoji: '🧪', color: '#1d4ed8', bg: '#eff6ff', frase_inicio: '¿pH qué? ¡Demuéstralo!', frase_nivel: '¡Nivel 8! ¡La rompes!' },
  { id: 9,  tema: 'Reacciones químicas',          emoji: '💥', color: '#7e22ce', bg: '#faf5ff', frase_inicio: 'Las reacciones no mienten', frase_nivel: '¡NIVEL 9! ¡Sos un crack!' },
  { id: 10, tema: 'Química orgánica básica',      emoji: '🌿', color: '#15803d', bg: '#f0fdf4', frase_inicio: '¡Mitad del camino! ¿Aguantas?', frase_nivel: '¡NIVEL 10! ¡Mitad! 🏅' },
  { id: 11, tema: 'Separación de mezclas',        emoji: '🔬', color: '#0f766e', bg: '#f0fdfa', frase_inicio: 'Aquí solo sobreviven los mejores', frase_nivel: '¡Nivel 11! ¡Eres nivel PRO!' },
  { id: 12, tema: 'Termodinámica',                emoji: '🌡️', color: '#b91c1c', bg: '#fff1f2', frase_inicio: '¡El calor no es broma!', frase_nivel: '¡NIVEL 12! ¡Legendario!' },
  { id: 13, tema: 'Electroquímica',               emoji: '⚡', color: '#ca8a04', bg: '#fefce8', frase_inicio: '¿Oxidación y reducción? Dale.', frase_nivel: '¡NIVEL 13! ¡Monstruo!' },
  { id: 14, tema: 'Cinética química',             emoji: '⏱️', color: '#4338ca', bg: '#eef2ff', frase_inicio: '¡Velocidad o muerte!', frase_nivel: '¡Nivel 14! ¡Increíble!' },
  { id: 15, tema: 'Análisis químico',             emoji: '📊', color: '#0891b2', bg: '#ecfeff', frase_inicio: '¡Solo los elegidos llegan aquí!', frase_nivel: '¡NIVEL 15! ¡Top 1%!' },
  { id: 16, tema: 'Química analítica avanzada',   emoji: '🏆', color: '#be185d', bg: '#fdf2f8', frase_inicio: '¡Si llegas aquí, eres élite!', frase_nivel: '¡NIVEL 16! ¡Genio puro!' },
  { id: 17, tema: 'Fisicoquímica',                emoji: '🌀', color: '#7c3aed', bg: '#f5f3ff', frase_inicio: '¡La física y la química se abrazan!', frase_nivel: '¡NIVEL 17! ¡Eres un monstruo!' },
  { id: 18, tema: 'Química de materiales',        emoji: '🔩', color: '#1e40af', bg: '#eff6ff', frase_inicio: '¡Casi nadie llega aquí, campeón!', frase_nivel: '¡NIVEL 18! ¡Leyenda viva!' },
  { id: 19, tema: 'Bioquímica',                   emoji: '🧬', color: '#065f46', bg: '#ecfdf5', frase_inicio: '¡La química de la vida misma!', frase_nivel: '¡NIVEL 19! ¡Casi Dios!' },
  { id: 20, tema: 'Albert Einsteinium (élite)',   emoji: '⚡', color: '#b45309', bg: '#fefce8', frase_inicio: '¡NIVEL FINAL! ¡Aquí termina todo!', frase_nivel: '¡NIVEL 20! ¡ERES EL ELEGIDO!' },
]

// ─── FRASES DE MOTIVACIÓN / BURLA ─────────────────────────────────────────────
const FRASES_CORRECTA = ['¡Así se hace! 🔥', '¡Exacto! 💪', '¡Crack! ✅', '¡Brillante! ⚡', '¡Perfecto! 🎯', '¡Eso mismo! 🧪']
const FRASES_MAL = ['¡Uy, no! 😬', '¡Fallaste! ❌', '¡Repasa eso! 📚', '¡Casi! 😅', '¡No era esa! 🤔', '¡Ups! 💀']
const FRASES_NIVEL = (n) => NIVELES[n - 1]?.frase_nivel || '¡Subiste de nivel!'
const FRASES_RACHA = ['🔥 x2', '🔥🔥 x3', '⚡ x4', '🌪️ x5', '💥 COMBO!']



// ─── PANTALLA INICIO ──────────────────────────────────────────────────────────
function PantallaInicio({ onStart }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-8 gap-5">
      <div className="text-7xl animate-bounce">🧪</div>
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: '#1e3a5f' }}>¿Cuánto sabes de química?</h1>
        <p className="text-sm" style={{ color: '#6b9fd4' }}>20 niveles temáticos · 30 segundos cada uno · ¡3 correctas seguidas para subir!</p>
      </div>
      <div className="w-full rounded-2xl p-4 text-left" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>¿Cómo funciona?</p>
        {[
          ['⏱️', '30 segundos por nivel — si se acaba, fin del juego'],
          ['✅', '3 respuestas correctas seguidas = siguiente nivel'],
          ['❌', 'Si fallas, el contador de correctas se reinicia a 0'],
          ['⚡', 'Más rápido respondes = más puntos'],
          ['🔥', 'Racha perfecta = multiplicador de puntos'],
        ].map(([ico, txt]) => (
          <div key={txt} className="flex items-start gap-2 mb-1.5">
            <span>{ico}</span><p className="text-xs" style={{ color: '#6b9fd4' }}>{txt}</p>
          </div>
        ))}
      </div>
      <div className="w-full rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid #bfdbfe' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>Evolución según puntos:</p>
        <div className="flex flex-wrap gap-1 justify-center">
          {PERSONAJES.map(p => (
            <div key={p.id} className="flex flex-col items-center" title={`${p.nombre} (${p.min} pts)`}>
              <span className="text-lg">{p.emoji}</span>
              <span className="text-[7px]" style={{ color: '#93c5fd' }}>{p.min}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onStart} className="w-full py-4 rounded-2xl text-white font-black text-lg active:scale-95 transition-all"
        style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
        ¡Empezar! 🚀
      </button>
    </div>
  )
}

// ─── CARGA DE PREGUNTAS DESDE SUPABASE ────────────────────────────────────────
// Trae las preguntas activas de todos los niveles en una sola consulta y las
// agrupa por nivel. Se llama una vez al iniciar el juego.
async function cargarPreguntasDesdeDB() {
  const { data, error } = await supabase
    .from('quiz_preguntas')
    .select('nivel, pregunta, opciones, respuesta_correcta')
    .eq('activa', true)
  if (error) throw error
  const porNivel = {}
  for (const row of data) {
    if (!porNivel[row.nivel]) porNivel[row.nivel] = []
    // Normalizar tipos: opciones puede llegar como string JSON y la respuesta como texto
    let opciones = row.opciones
    if (typeof opciones === 'string') { try { opciones = JSON.parse(opciones) } catch { opciones = [] } }
    if (!Array.isArray(opciones) || opciones.length === 0) continue
    const correcta = Number(row.respuesta_correcta) || 0
    // Barajar el orden de las opciones para que la correcta no quede siempre en A
    const idxs = shuffle(opciones.map((_, i) => i))
    const ops = idxs.map(i => opciones[i])
    const r = idxs.indexOf(correcta)
    porNivel[row.nivel].push({ q: row.pregunta, ops, r })
  }
  return porNivel
}

// ─── JUEGO PRINCIPAL ──────────────────────────────────────────────────────────
function JuegoPrincipal({ onGameOver }) {
  const TIEMPO_MAX = 30
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const bancoPreguntas = useRef({}) // { [nivel]: [{q, ops, r}, ...] }
  const [nivelIdx, setNivelIdx] = useState(0)          // 0-19
  const [tiempo, setTiempo] = useState(TIEMPO_MAX)
  const [correctasNivel, setCorrectasNivel] = useState(0) // correctas seguidas en nivel actual
  const [preguntasNivel, setPreguntasNivel] = useState([])
  const [pregIdx, setPregIdx] = useState(0)
  const [seleccion, setSeleccion] = useState(null)
  const [feedback, setFeedback] = useState(null)       // {ok, frase}
  const [flashNivel, setFlashNivel] = useState(null)    // frase flash al subir nivel
  const [puntos, setPuntos] = useState(0)
  const [racha, setRacha] = useState(0)
  const [statsNiveles, setStatsNiveles] = useState([])  // historial
  const tiempoRef = useRef(TIEMPO_MAX)
  const bloqueado = useRef(false)
  const gameOverRef = useRef(false)

  // Carga inicial del banco de preguntas desde Supabase
  useEffect(() => {
    let cancelado = false
    cargarPreguntasDesdeDB()
      .then((banco) => {
        if (cancelado) return
        bancoPreguntas.current = banco
        const preguntasNivel1 = banco[NIVELES[0].id]
        if (!preguntasNivel1 || preguntasNivel1.length === 0) {
          setErrorCarga('No hay preguntas disponibles para este nivel.')
          return
        }
        setPreguntasNivel(shuffle(preguntasNivel1))
        setCargando(false)
      })
      .catch((e) => {
        console.error('Error cargando preguntas:', e)
        if (!cancelado) setErrorCarga('No se pudieron cargar las preguntas. Revisa tu conexión.')
      })
    return () => { cancelado = true }
  }, [])

  const nivelDef = NIVELES[nivelIdx]
  const pregunta = preguntasNivel.length > 0 ? preguntasNivel[pregIdx % preguntasNivel.length] : null

  // Cronómetro (solo corre una vez cargadas las preguntas)
  useEffect(() => {
    if (cargando || errorCarga || gameOverRef.current) return
    const t = setInterval(() => {
      tiempoRef.current -= 1
      setTiempo(tiempoRef.current)
      if (tiempoRef.current <= 0 && !gameOverRef.current) {
        gameOverRef.current = true
        clearInterval(t)
        onGameOver({ puntos, racha, nivelMax: nivelIdx + 1, statsNiveles })
      }
    }, 1000)
    return () => clearInterval(t)
  }, [nivelIdx, cargando, errorCarga])

  const subirNivel = useCallback((ptsActuales, rachaActual, statsActuales) => {
    const siguienteIdx = nivelIdx + 1
    if (siguienteIdx >= NIVELES.length) {
      gameOverRef.current = true
      onGameOver({ puntos: ptsActuales, racha: rachaActual, nivelMax: NIVELES.length, statsNiveles: statsActuales, ganador: true })
      return
    }
    const frase = FRASES_NIVEL(siguienteIdx + 1)
    setFlashNivel(frase)
    setTimeout(() => setFlashNivel(null), 1800)
    tiempoRef.current = TIEMPO_MAX
    setTiempo(TIEMPO_MAX)
    setNivelIdx(siguienteIdx)
    setCorrectasNivel(0)
    setPreguntasNivel(shuffle(bancoPreguntas.current[NIVELES[siguienteIdx].id] || []))
    setPregIdx(0)
  }, [nivelIdx, onGameOver])

  const responder = useCallback((opIdx) => {
    if (bloqueado.current || gameOverRef.current || !pregunta) return
    bloqueado.current = true
    const ok = opIdx === pregunta.r
    const tiempoRespuesta = TIEMPO_MAX - tiempoRef.current
    const bonusVelocidad = ok ? Math.max(1, Math.round((TIEMPO_MAX - tiempoRespuesta) / 3)) : 0
    const nuevaRacha = ok ? racha + 1 : 0
    const multiplicador = ok ? Math.max(1, Math.floor(nuevaRacha / 3) + 1) : 1
    const ptsGanados = ok ? (10 + bonusVelocidad) * multiplicador : 0
    const nuevosPuntos = puntos + ptsGanados
    const nuevoCorrectas = ok ? correctasNivel + 1 : 0
    const frase = ok ? FRASES_CORRECTA[Math.floor(Math.random() * FRASES_CORRECTA.length)] : FRASES_MAL[Math.floor(Math.random() * FRASES_MAL.length)]

    setSeleccion(opIdx)
    setFeedback({ ok, frase, pts: ptsGanados, multiplicador })
    setPuntos(nuevosPuntos)
    setRacha(nuevaRacha)
    setCorrectasNivel(nuevoCorrectas)

    setTimeout(() => {
      setSeleccion(null)
      setFeedback(null)
      setPregIdx(i => i + 1)
      bloqueado.current = false

      if (nuevoCorrectas >= 3) {
        const nuevasStats = [...statsNiveles, { nivel: nivelIdx + 1, tema: nivelDef.tema }]
        setStatsNiveles(nuevasStats)
        subirNivel(nuevosPuntos, nuevaRacha, nuevasStats)
      }
    }, ok ? 500 : 700)
  }, [pregunta, racha, puntos, correctasNivel, nivelIdx, nivelDef, statsNiveles, subirNivel])

  const pctTiempo = (tiempo / TIEMPO_MAX) * 100
  const colorTiempo = tiempo > 15 ? nivelDef.color : tiempo > 8 ? '#f59e0b' : '#ef4444'

  if (errorCarga) {
    return (
      <div className="flex flex-col items-center text-center px-4 py-10 gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm font-semibold" style={{ color: '#c62828' }}>{errorCarga}</p>
        <p className="text-xs" style={{ color: '#6b9fd4' }}>Intenta recargar la página.</p>
      </div>
    )
  }

  if (cargando || !pregunta) {
    return (
      <div className="flex flex-col items-center text-center px-4 py-10 gap-3">
        <div className="text-4xl animate-bounce">🧪</div>
        <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>Cargando preguntas...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-4 relative">

      {/* Flash al subir nivel */}
      {flashNivel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl pointer-events-none"
          style={{ background: 'rgba(37,99,235,0.92)', backdropFilter: 'blur(4px)' }}>
          <div className="text-center">
            <div className="text-5xl mb-2">🚀</div>
            <p className="text-white font-black text-xl px-4">{flashNivel}</p>
            <p className="text-blue-200 text-sm mt-1">{NIVELES[nivelIdx]?.tema}</p>
          </div>
        </div>
      )}

      {/* Header: nivel + puntos + racha */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nivelDef.emoji}</span>
          <div>
            <p className="text-[10px] font-bold leading-none" style={{ color: '#93c5fd' }}>NIVEL {nivelIdx + 1}/20</p>
            <p className="text-xs font-bold leading-tight" style={{ color: '#1e3a5f' }}>{nivelDef.tema}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black tabular-nums leading-none" style={{ color: '#1d4ed8' }}>{puntos}</p>
          {racha >= 2 && <p className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>{FRASES_RACHA[Math.min(racha - 2, 4)]}</p>}
        </div>
      </div>

      {/* Barra de tiempo */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-black tabular-nums w-6" style={{ color: colorTiempo }}>{tiempo}</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#dbeafe' }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pctTiempo}%`, background: colorTiempo }} />
          </div>
        </div>
        {/* Progreso correctas en nivel */}
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-8 h-1.5 rounded-full transition-all" style={{ background: i < correctasNivel ? nivelDef.color : '#dbeafe' }} />
          ))}
        </div>
        <p className="text-center text-[10px] mt-0.5" style={{ color: '#93c5fd' }}>{correctasNivel}/3 para subir de nivel</p>
      </div>

      {/* Pregunta */}
      <div className="rounded-2xl p-4 min-h-[80px] flex items-center justify-center"
        style={{ background: `${nivelDef.bg}`, border: `1.5px solid ${nivelDef.color}40`, backdropFilter: 'blur(8px)' }}>
        <p className="text-[15px] font-semibold leading-snug text-center" style={{ color: '#1e3a5f' }}>{pregunta.q}</p>
      </div>

      {/* 3 Opciones coloridas */}
      <div className="flex flex-col gap-2">
        {pregunta.ops.map((op, i) => {
          const COLORES = [
            { bg: '#fff3e0', border: '#ffb74d', letter: '#ff9800', text: '#e65100' },
            { bg: '#e8f5e9', border: '#66bb6a', letter: '#4caf50', text: '#1b5e20' },
            { bg: '#fce4ec', border: '#f48fb1', letter: '#e91e63', text: '#880e4f' },
          ]
          const c = COLORES[i]
          let bg = c.bg, border = c.border, textC = c.text, fontW = '600', opacity = 1
          if (seleccion !== null) {
            if (i === pregunta.r) { bg = '#e8f5e9'; border = '#4caf50'; textC = '#1b5e20'; fontW = '700' }
            else if (i === seleccion) { bg = '#fce4ec'; border = '#ef5350'; textC = '#c62828'; fontW = '600' }
            else { opacity = 0.35 }
          }
          return (
            <button key={i} onClick={() => responder(i)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all active:scale-[0.98]"
              style={{ background: bg, border: `1.5px solid ${border}`, color: textC, fontWeight: fontW, opacity }}>
              <span className="inline-flex items-center justify-center rounded-full text-white text-xs font-black mr-2"
                style={{ width: 22, height: 22, background: seleccion !== null && i !== pregunta.r && i !== seleccion ? '#bdbdbd' : c.letter, flexShrink: 0 }}>
                {['A','B','C'][i]}
              </span>
              {op}
              {seleccion !== null && i === pregunta.r && ' ✓'}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="text-center py-1">
          <p className="text-sm font-black" style={{ color: feedback.ok ? '#16a34a' : '#dc2626' }}>{feedback.frase}</p>
          {feedback.ok && feedback.pts > 0 && (
            <p className="text-xs font-bold" style={{ color: '#2563eb' }}>+{feedback.pts} pts{feedback.multiplicador > 1 ? ` ×${feedback.multiplicador}` : ''}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PANTALLA GAME OVER / RESULTADO ──────────────────────────────────────────
function PantallaFinal({ stats, onReiniciar }) {
  const { puntos, racha, nivelMax, statsNiveles, ganador } = stats
  const per = getPersonaje(puntos)
  const frames = PERSONAJES.filter(p => p.min <= puntos)
  const [frameIdx, setFrameIdx] = useState(0)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    if (frameIdx < frames.length - 1) {
      const t = setTimeout(() => setFrameIdx(i => i + 1), 260)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setShowCard(true), 400)
      return () => clearTimeout(t)
    }
  }, [frameIdx, frames.length])

  const emojiSize = (i) => {
    const dist = frames.length - 1 - i
    if (dist === 0) return 72
    if (dist === 1) return 40
    if (dist === 2) return 28
    if (dist === 3) return 22
    return 16
  }

  return (
    <div className="flex flex-col items-center text-center px-4 py-6 gap-4">

      {/* Tira de evolución con tamaños crecientes */}
      <div>
        <p className="text-[10px] font-bold mb-3 tracking-widest" style={{ color: '#7EB6FF' }}>TU EVOLUCIÓN</p>
        <div className="flex items-end justify-center gap-1 mb-2">
          {frames.map((f, i) => {
            const size = emojiSize(i)
            const isActive = i === frameIdx
            const isPast = i < frameIdx
            const isFinal = i === frames.length - 1 && frameIdx === frames.length - 1
            return (
              <div key={f.id} className="flex flex-col items-center gap-1 transition-all"
                style={{ opacity: isPast || isActive ? 1 : 0.2 }}>
                <span style={{
                  fontSize: size,
                  lineHeight: 1,
                  filter: isFinal ? `drop-shadow(0 0 12px ${f.color || '#ffd54f'})` : 'none',
                  transform: isFinal ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s',
                  display: 'block'
                }}>{f.emoji}</span>
                <div style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: isPast || isActive ? (f.color || '#4caf50') : 'rgba(255,255,255,0.2)'
                }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Card resultado — aparece después de la animación */}
      {showCard && (
        <div className="w-full rounded-2xl overflow-hidden" style={{ background: '#fff', border: '0.5px solid #F2F7FF' }}>
          {/* Header del personaje */}
          <div className="py-5 px-4" style={{ background: per.bg || '#e8f5e9' }}>
            <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 8, filter: `drop-shadow(0 4px 16px ${per.color}40)` }}>
              {per.emoji}
            </div>
            {ganador
              ? <p className="text-xs font-bold mb-1" style={{ color: '#f9a825' }}>🏆 ¡COMPLETASTE LOS 20 NIVELES!</p>
              : <p className="text-xs font-bold mb-1" style={{ color: '#ef5350' }}>⏰ Tiempo agotado en nivel {nivelMax}</p>
            }
            <h2 className="text-xl font-black mb-1" style={{ color: per.color || '#1b5e20' }}>{per.nombre}</h2>
            <p className="text-xs italic" style={{ color: per.color || '#2e7d32', opacity: 0.8 }}>"{per.desc}"</p>
          </div>

          {/* Stats en 4 tarjetas de colores */}
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl p-3 text-center" style={{ background: '#e8f5e9' }}>
              <div className="text-2xl font-black" style={{ color: '#1b5e20' }}>{puntos}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#2e7d32', opacity: 0.8 }}>Puntos totales</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#e3f2fd' }}>
              <div className="text-2xl font-black" style={{ color: '#0d47a1' }}>Nv. {nivelMax}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#1565c0', opacity: 0.8 }}>Nivel máximo</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#fff8e1' }}>
              <div className="text-2xl font-black" style={{ color: '#e65100' }}>🔥 {racha}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#bf360c', opacity: 0.8 }}>Racha máxima</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#f3e5f5' }}>
              <div className="text-2xl font-black" style={{ color: '#4a148c' }}>{statsNiveles.length}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#6a1b9a', opacity: 0.8 }}>Niveles superados</div>
            </div>
          </div>

          {/* Badges de niveles superados */}
          {statsNiveles.length > 0 && (
            <div className="px-3 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {statsNiveles.map((s, i) => {
                  const nv = NIVELES[s.nivel - 1]
                  return (
                    <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: `${nv?.color}18`, color: nv?.color, border: `1px solid ${nv?.color}40` }}>
                      {nv?.emoji} Nv.{s.nivel}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Escala completa de personajes */}
          <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: '#f8f9ff', border: '0.5px solid #F2F7FF' }}>
            <div className="grid grid-cols-5 gap-1">
              {PERSONAJES.map(p => (
                <div key={p.id} className="flex flex-col items-center p-1 rounded-lg transition-all"
                  style={{
                    background: puntos >= p.min ? `${p.bg}` : 'transparent',
                    border: per.id === p.id ? `2px solid ${p.color}` : '2px solid transparent',
                    opacity: puntos >= p.min ? 1 : 0.25
                  }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>
                  <span className="text-[7px] leading-tight text-center mt-0.5" style={{ color: puntos >= p.min ? p.color : '#7EB6FF' }}>
                    {p.nombre.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-3 pb-4">
            <button onClick={onReiniciar} className="w-full py-3 rounded-xl text-white font-black text-sm active:scale-95 transition-all"
              style={{ background: '#2F80ED', boxShadow: '0 4px 16px rgba(47,128,237,0.35)' }}>
              🔄 Jugar de nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function QuimicaGamePage() {
  const { session } = useAuth()
  const [pantalla, setPantalla] = useState('inicio')
  const [statsFinales, setStatsFinales] = useState(null)

  async function guardarResultado(pts, per) {
    if (!session?.user?.id) return
    try {
      const { data: current } = await supabase
        .from('profiles')
        .select('quimica_pts')
        .eq('id', session.user.id)
        .single()
      // Solo guardar si supera el récord anterior
      if (!current || pts > (current.quimica_pts || 0)) {
        await supabase.from('profiles').update({
          quimica_pts: pts,
          quimica_personaje: per.emoji,
          quimica_nombre: per.nombre,
        }).eq('id', session.user.id)
      }
    } catch (e) { console.error('Error guardando resultado:', e) }
  }

  function iniciar() { setPantalla('juego') }
  function gameOver(stats) {
    setStatsFinales(stats)
    setPantalla('final')
    const per = getPersonaje(stats.puntos)
    guardarResultado(stats.puntos, per)
  }
  function reiniciar() { setPantalla('juego') }

  return (
    <div className="max-w-lg mx-auto" style={{ paddingBottom: 100 }}>
      <div className="rounded-2xl overflow-hidden shadow-sm mx-3 mt-3" style={{ background: '#ffffff', border: '0.5px solid #F2F7FF' }}>
        {pantalla === 'inicio' && <PantallaInicio onStart={iniciar} />}
        {pantalla === 'juego' && <JuegoPrincipal key={Date.now()} onGameOver={gameOver} />}
        {pantalla === 'final' && statsFinales && <PantallaFinal stats={statsFinales} onReiniciar={reiniciar} />}
      </div>
    </div>
  )
}
