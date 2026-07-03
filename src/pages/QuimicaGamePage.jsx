import { useState, useEffect, useRef, useCallback } from 'react'

// ─── 15 PERSONAJES DE EVOLUCIÓN ───────────────────────────────────────────────
const PERSONAJES = [
  { id: 0,  min: 0,   emoji: '🐒', nombre: 'Simio Curioso',       desc: 'Todavía confunde el agua con el café.' },
  { id: 1,  min: 3,   emoji: '🦧', nombre: 'Mono Pensativo',       desc: 'Algo se está moviendo en ese cerebro.' },
  { id: 2,  min: 6,   emoji: '👶', nombre: 'Bebé Científico',       desc: 'Lo prueba todo. Literalmente todo.' },
  { id: 3,  min: 10,  emoji: '👦', nombre: 'Niño Curioso',         desc: '¿Por qué el cielo es azul? ¿Y el agua moja?' },
  { id: 4,  min: 15,  emoji: '🎒', nombre: 'Estudiante de Bachiller', desc: 'Memorizó la tabla periódica... una vez.' },
  { id: 5,  min: 21,  emoji: '📚', nombre: 'Universitario de 1er año', desc: 'Conoce la estequiometría. En teoría.' },
  { id: 6,  min: 28,  emoji: '🔬', nombre: 'Practicante de Lab',    desc: 'Ya no rompe pipetas. Casi nunca.' },
  { id: 7,  min: 36,  emoji: '👩‍🔬', nombre: 'Laboratorista',        desc: 'Sabe cuándo la reacción va a salir mal.' },
  { id: 8,  min: 45,  emoji: '🧪', nombre: 'Técnico Químico',       desc: 'Huele el reactivo y ya sabe qué es.' },
  { id: 9,  min: 55,  emoji: '👨‍🏫', nombre: 'Profesor Labortosita', desc: 'Explica lo mismo 40 veces con paciencia infinita.' },
  { id: 10, min: 66,  emoji: '🧫', nombre: 'Investigador',          desc: 'Publica papers que nadie lee. Pero importan.' },
  { id: 11, min: 78,  emoji: '🏆', nombre: 'Químico Senior',        desc: 'Ha visto explosiones que no están en el manual.' },
  { id: 12, min: 90,  emoji: '🎓', nombre: 'PhD en Química',        desc: 'Cinco años de tesis para llegar a esto.' },
  { id: 13, min: 105, emoji: '⚗️',  nombre: 'Maestro Alquimista',   desc: 'Convierte el plomo en oro... bueno, casi.' },
  { id: 14, min: 120, emoji: '⚡', nombre: 'Albert Einsteinium',    desc: 'E=mc². Y sabe por qué.' },
]

function getPersonaje(pts) {
  let p = PERSONAJES[0]
  for (const per of PERSONAJES) { if (pts >= per.min) p = per }
  return p
}
function getNextPersonaje(pts) {
  return PERSONAJES.find(p => p.min > pts) || null
}

// ─── BANCO DE PREGUNTAS ───────────────────────────────────────────────────────
const PREGUNTAS = {
  1: [
    { q: '¿Cuál es el símbolo químico del oro?', ops: ['Or', 'Go', 'Au', 'Ag'], r: 2 },
    { q: '¿Cuántos estados de la materia existen en la naturaleza?', ops: ['2', '3', '4', '5'], r: 2 },
    { q: '¿Qué es un átomo?', ops: ['La unidad más pequeña de un elemento', 'Una molécula con carga', 'Un tipo de enlace', 'Una reacción química'], r: 0 },
    { q: '¿Qué significa pH?', ops: ['Potencial de Hidrógeno', 'Peso Hidrogénico', 'Presión Hídrica', 'Promedio Hidrodinámico'], r: 0 },
    { q: 'El agua pura tiene un pH de:', ops: ['0', '5', '7', '14'], r: 2 },
    { q: '¿Qué elemento es el más abundante en la corteza terrestre?', ops: ['Hierro', 'Silicio', 'Oxígeno', 'Aluminio'], r: 2 },
    { q: '¿Cuál es la fórmula del agua?', ops: ['HO', 'H₂O', 'H₃O', 'OH₂'], r: 1 },
    { q: 'Una solución ácida tiene pH:', ops: ['Mayor a 7', 'Igual a 7', 'Menor a 7', 'Igual a 0'], r: 2 },
    { q: '¿Qué tipo de enlace forma el NaCl (sal)?', ops: ['Covalente', 'Iónico', 'Metálico', 'Van der Waals'], r: 1 },
    { q: '¿Cuál es el gas más abundante en la atmósfera?', ops: ['Oxígeno', 'CO₂', 'Nitrógeno', 'Argón'], r: 2 },
    { q: '¿Qué es una mezcla homogénea?', ops: ['Tiene dos fases visibles', 'Es uniforme en toda su extensión', 'Solo contiene un elemento', 'No se puede separar'], r: 1 },
    { q: '¿Cuál es el símbolo del sodio?', ops: ['So', 'Na', 'Sd', 'Sn'], r: 1 },
    { q: 'La destilación separa mezclas por diferencia de:', ops: ['Color', 'Densidad', 'Punto de ebullición', 'Solubilidad'], r: 2 },
    { q: '¿Qué es un reactivo limitante?', ops: ['El que sobra en la reacción', 'El que se consume primero y detiene la reacción', 'El catalizador', 'El producto principal'], r: 1 },
    { q: '¿Cuál es la unidad de concentración más común en laboratorio?', ops: ['g/mL', 'mol/L (M)', 'kg/m³', 'ppm'], r: 1 },
    { q: '¿Qué hace un catalizador en una reacción?', ops: ['Aumenta el rendimiento', 'Acelera la reacción sin consumirse', 'Eleva la temperatura', 'Genera más productos'], r: 1 },
    { q: 'El hielo, el agua y el vapor son:', ops: ['Tres sustancias distintas', 'Tres estados del mismo compuesto', 'Mezclas homogéneas', 'Compuestos diferentes'], r: 1 },
    { q: '¿Qué es la evaporación?', ops: ['Paso de gas a líquido', 'Paso de sólido a gas', 'Paso de líquido a gas en la superficie', 'Paso de sólido a líquido'], r: 2 },
    { q: 'La tabla periódica ordena los elementos por:', ops: ['Masa atómica creciente', 'Número atómico creciente', 'Densidad creciente', 'Orden alfabético'], r: 1 },
    { q: '¿Cuál es el gas que produce la fotosíntesis?', ops: ['CO₂', 'N₂', 'O₂', 'H₂'], r: 2 },
  ],
  2: [
    { q: '¿Qué mide la molaridad?', ops: ['Moles de soluto por litro de solución', 'Gramos por mililitro', 'Presión osmótica', 'Temperatura de ebullición'], r: 0 },
    { q: 'En una reacción exotérmica:', ops: ['Se absorbe calor del entorno', 'Se libera calor al entorno', 'La temperatura no cambia', 'Se consume el catalizador'], r: 1 },
    { q: '¿Qué es la estequiometría?', ops: ['Medición de temperatura', 'Relación cuantitativa entre reactivos y productos', 'Estudio de los estados de materia', 'Análisis de espectros'], r: 1 },
    { q: 'La Ley de Conservación de la Masa establece que:', ops: ['La masa aumenta en reacciones', 'La masa se destruye al reaccionar', 'La masa total se conserva en una reacción', 'Solo se conserva en reacciones físicas'], r: 2 },
    { q: '¿Qué es un tampón o buffer?', ops: ['Solución que resiste cambios de pH', 'Mezcla de ácido fuerte y base fuerte', 'Solución con pH 7', 'Ácido que no se disocia'], r: 0 },
    { q: 'Una solución 1M de HCl contiene:', ops: ['1g de HCl por litro', '1 mol de HCl por litro', '1% de HCl en masa', '1 equivalente de HCl'], r: 1 },
    { q: '¿Qué es la destilación fraccionada?', ops: ['Separar sólidos de líquidos', 'Separar líquidos con puntos de ebullición cercanos', 'Cristalizar una sal', 'Filtrar una mezcla'], r: 1 },
    { q: 'El número de Avogadro es aproximadamente:', ops: ['6.02 × 10²³', '3.14 × 10¹⁵', '1.67 × 10⁻²⁷', '9.8 × 10⁶'], r: 0 },
    { q: '¿Cuál es el principio de Le Chatelier?', ops: ['Todo gas ocupa el espacio disponible', 'Un sistema en equilibrio se opone a perturbaciones externas', 'Los ácidos se neutralizan con bases', 'La energía no se crea ni se destruye'], r: 1 },
    { q: 'La cromatografía separa mezclas por diferencia de:', ops: ['Temperatura', 'Afinidad por fases estacionaria y móvil', 'Carga eléctrica', 'Densidad'], r: 1 },
    { q: '¿Qué es la solubilidad?', ops: ['Capacidad de un solvente de evaporarse', 'Máxima cantidad de soluto que se disuelve en un solvente a T dada', 'Velocidad a la que se mezclan dos líquidos', 'Punto en que una solución hierve'], r: 1 },
    { q: 'El enlace covalente se forma por:', ops: ['Transferencia de electrones', 'Compartición de electrones', 'Atracción de iones opuestos', 'Fuerzas de Van der Waals'], r: 1 },
    { q: '¿Qué es la titulación?', ops: ['Medir el pH con indicador', 'Determinar la concentración de una solución usando otra de concentración conocida', 'Filtrar una solución', 'Preparar una dilución'], r: 1 },
    { q: 'En una reacción de neutralización se forma:', ops: ['Solo agua', 'Una sal y agua', 'Solo gas CO₂', 'Un ácido más fuerte'], r: 1 },
    { q: '¿Qué diferencia un ácido fuerte de uno débil?', ops: ['El color', 'Grado de disociación en agua', 'El olor', 'La temperatura de ebullición'], r: 1 },
    { q: 'La concentración ppm significa:', ops: ['Partes por millón', 'Presión por masa', 'Partes por mililitro', 'Potencial por mol'], r: 0 },
    { q: '¿Qué es la hidrólisis?', ops: ['Unión de moléculas con agua', 'Ruptura de un enlace con agua', 'Evaporación del agua', 'Ionización del agua pura'], r: 1 },
    { q: 'La viscosidad de un líquido mide:', ops: ['Su densidad', 'Su resistencia a fluir', 'Su punto de fusión', 'Su capacidad calorífica'], r: 1 },
    { q: '¿Qué es la osmosis?', ops: ['Paso de soluto a través de membrana', 'Paso de solvente de zona diluida a concentrada a través de membrana semipermeable', 'Evaporación en membranas', 'Filtración por presión'], r: 1 },
    { q: 'Un precipitado se forma cuando:', ops: ['Dos gases reaccionan', 'Un sólido insoluble aparece en una solución', 'Una solución se evapora', 'Se mezclan dos ácidos'], r: 1 },
  ],
  3: [
    { q: '¿Qué mide la constante de equilibrio Keq?', ops: ['Velocidad de la reacción', 'Relación entre concentraciones de productos y reactivos en equilibrio', 'Energía de activación', 'Temperatura óptima'], r: 1 },
    { q: 'La cinética química estudia:', ops: ['Energía de las reacciones', 'Velocidad y mecanismo de las reacciones', 'Estructura molecular', 'Propiedades de los gases'], r: 1 },
    { q: '¿Qué es la entalpía de formación?', ops: ['Calor liberado al quemar un compuesto', 'Energía necesaria para romper un enlace', 'Calor al formar 1 mol de compuesto desde elementos en estado estándar', 'Temperatura de reacción'], r: 2 },
    { q: 'El espectro UV-Vis en química analítica se usa para:', ops: ['Medir masa molecular', 'Cuantificar absorbancia y concentración (Ley Beer-Lambert)', 'Separar compuestos', 'Medir punto de fusión'], r: 1 },
    { q: '¿Qué es la quiralidad en química orgánica?', ops: ['Propiedad de moléculas con doble enlace', 'Molécula no superponible a su imagen especular', 'Enlace entre dos carbonos', 'Reacción de sustitución'], r: 1 },
    { q: 'La ley de Beer-Lambert relaciona:', ops: ['pH y concentración', 'Absorbancia y concentración de una solución', 'Presión y volumen', 'Temperatura y velocidad'], r: 1 },
    { q: '¿Qué es la energía de Gibbs (ΔG)?', ops: ['Calor intercambiado a presión constante', 'Energía libre que determina espontaneidad de una reacción', 'Entropía del sistema', 'Temperatura de activación'], r: 1 },
    { q: 'Una reacción de segundo orden depende de:', ops: ['La concentración de un reactivo', 'El cuadrado de la concentración o dos reactivos', 'La temperatura únicamente', 'El catalizador'], r: 1 },
    { q: '¿Qué es la saponificación?', ops: ['Reacción de un ácido con una base para formar sal', 'Hidrólisis de ésteres con base fuerte para producir jabón y glicerol', 'Esterificación de un alcohol', 'Oxidación de un aldehído'], r: 1 },
    { q: 'La cromatografía HPLC separa compuestos por:', ops: ['Tamaño molecular exclusivamente', 'Diferencia de afinidad a fase estacionaria bajo alta presión', 'Punto de ebullición', 'Carga eléctrica'], r: 1 },
    { q: '¿Qué es la constante de acidez Ka?', ops: ['pH de un ácido fuerte', 'Medida del grado de disociación de un ácido débil', 'Concentración de H⁺ en solución', 'Temperatura a la que un ácido se disocia'], r: 1 },
    { q: 'En la nomenclatura IUPAC, el sufijo -ol indica:', ops: ['Un aldehído', 'Un ácido carboxílico', 'Un alcohol', 'Un éter'], r: 2 },
    { q: '¿Qué es la espectroscopia de masas?', ops: ['Mide absorbancia de luz', 'Ioniza y separa moléculas por relación masa/carga', 'Analiza espectros de color', 'Mide conductividad eléctrica'], r: 1 },
    { q: 'El coeficiente de distribución (Kd) es importante en:', ops: ['Cinética de reacciones', 'Extracción líquido-líquido para separar compuestos', 'Espectroscopía infrarroja', 'Cristalización'], r: 1 },
    { q: '¿Qué implica una ΔG negativa en una reacción?', ops: ['La reacción es no espontánea', 'La reacción es espontánea en condiciones estándar', 'No hay cambio de energía', 'La reacción es endotérmica'], r: 1 },
    { q: 'La reacción de Fischer se usa para sintetizar:', ops: ['Proteínas', 'Ésteres a partir de ácidos y alcoholes', 'Ácidos grasos', 'Sales inorgánicas'], r: 1 },
    { q: '¿Qué es la tensión superficial?', ops: ['Presión dentro de una burbuja', 'Fuerza por unidad de longitud en la superficie de un líquido por cohesión molecular', 'Viscosidad del líquido', 'Punto de ebullición del líquido'], r: 1 },
    { q: 'La electroforesis separa moléculas por:', ops: ['Diferencia de solubilidad', 'Tamaño y carga bajo campo eléctrico', 'Punto de fusión', 'Afinidad por solventes'], r: 1 },
    { q: '¿Qué es la isomería cis-trans?', ops: ['Isomería por número de carbonos', 'Disposición espacial distinta de grupos alrededor de un doble enlace', 'Diferencia en punto de ebullición', 'Variación de masa molecular'], r: 1 },
    { q: 'El potencial zeta mide:', ops: ['pH de una suspensión', 'Carga eléctrica superficial de partículas en suspensión coloidal', 'Viscosidad de una emulsión', 'Temperatura de gelificación'], r: 1 },
  ],
}

// ─── TIEMPO ───────────────────────────────────────────────────────────────────
const TIEMPO_NIVEL = 60 // segundos por nivel

// ─── COMPONENTE BARRA DE TIEMPO ───────────────────────────────────────────────
function BarraTiempo({ segundos }) {
  const pct = (segundos / TIEMPO_NIVEL) * 100
  const color = segundos > 20 ? '#2563eb' : segundos > 10 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-black tabular-nums" style={{ color, minWidth: 28 }}>{segundos}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#dbeafe' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── PANTALLA INICIO ──────────────────────────────────────────────────────────
function PantallaInicio({ onStart }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-8 gap-6">
      <div className="text-6xl">🧪</div>
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: '#1e3a5f' }}>¿Cuánto sabes de química?</h1>
        <p className="text-sm" style={{ color: '#6b9fd4' }}>3 niveles · 1 minuto cada uno · ¡Responde cuantas puedas!</p>
      </div>
      <div className="w-full rounded-2xl p-4 text-left space-y-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        {[
          ['🟢', 'Nivel 1 — Básico', 'Conceptos fundamentales de química'],
          ['🟡', 'Nivel 2 — Intermedio', 'Soluciones, reacciones y análisis'],
          ['🔴', 'Nivel 3 — Experto', 'Química analítica, orgánica y fisicoquímica'],
        ].map(([ico, tit, desc]) => (
          <div key={tit} className="flex items-start gap-2">
            <span className="text-lg leading-none">{ico}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{tit}</p>
              <p className="text-xs" style={{ color: '#6b9fd4' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-4 w-full" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #bfdbfe' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#1e3a5f' }}>Tu evolución según puntos:</p>
        <div className="flex flex-wrap gap-1 justify-center">
          {PERSONAJES.map(p => (
            <div key={p.id} title={`${p.nombre} (${p.min} pts)`} className="flex flex-col items-center">
              <span className="text-xl">{p.emoji}</span>
              <span className="text-[8px]" style={{ color: '#93c5fd' }}>{p.min}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onStart} className="w-full py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95"
        style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
        ¡Empezar! 🚀
      </button>
    </div>
  )
}

// ─── PANTALLA NIVEL ───────────────────────────────────────────────────────────
function PantallaNivel({ nivel, preguntas, onTerminar }) {
  const [idx, setIdx] = useState(0)
  const [correctas, setCorrectas] = useState(0)
  const [respondidas, setRespondidas] = useState(0)
  const [tiempo, setTiempo] = useState(TIEMPO_NIVEL)
  const [seleccion, setSeleccion] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'ok' | 'mal'
  const terminado = useRef(false)
  const pregunta = preguntas[idx % preguntas.length]

  useEffect(() => {
    if (tiempo <= 0 && !terminado.current) {
      terminado.current = true
      onTerminar(correctas, respondidas)
    }
  }, [tiempo])

  useEffect(() => {
    if (terminado.current) return
    const t = setInterval(() => setTiempo(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  const responder = useCallback((opIdx) => {
    if (seleccion !== null || terminado.current) return
    setSeleccion(opIdx)
    const ok = opIdx === pregunta.r
    setFeedback(ok ? 'ok' : 'mal')
    if (ok) setCorrectas(c => c + 1)
    setRespondidas(r => r + 1)
    setTimeout(() => {
      setSeleccion(null)
      setFeedback(null)
      setIdx(i => i + 1)
    }, 500)
  }, [seleccion, pregunta])

  const nivelColors = { 1: { bg: '#f0fdf4', border: '#86efac', acento: '#16a34a', label: '🟢 Nivel 1 — Básico' }, 2: { bg: '#fefce8', border: '#fde047', acento: '#ca8a04', label: '🟡 Nivel 2 — Intermedio' }, 3: { bg: '#fff1f2', border: '#fca5a5', acento: '#dc2626', label: '🔴 Nivel 3 — Experto' } }
  const nc = nivelColors[nivel]

  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: nc.bg, color: nc.acento, border: `1px solid ${nc.border}` }}>{nc.label}</span>
        <span className="text-xs font-bold" style={{ color: '#6b9fd4' }}>✅ {correctas} / {respondidas}</span>
      </div>

      {/* Tiempo */}
      <BarraTiempo segundos={tiempo} />

      {/* Pregunta */}
      <div className="rounded-2xl p-4 min-h-[90px] flex items-center" style={{ background: 'rgba(255,255,255,0.85)', border: `1.5px solid ${nc.border}`, backdropFilter: 'blur(8px)' }}>
        <p className="text-[15px] font-semibold leading-snug text-center w-full" style={{ color: '#1e3a5f' }}>{pregunta.q}</p>
      </div>

      {/* Opciones */}
      <div className="grid grid-cols-1 gap-2">
        {pregunta.ops.map((op, i) => {
          let bg = 'rgba(255,255,255,0.8)', border = '#bfdbfe', color = '#1e3a5f'
          if (seleccion !== null) {
            if (i === pregunta.r) { bg = '#f0fdf4'; border = '#4ade80'; color = '#15803d' }
            else if (i === seleccion && i !== pregunta.r) { bg = '#fff1f2'; border = '#fca5a5'; color = '#dc2626' }
          }
          return (
            <button key={i} onClick={() => responder(i)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ background: bg, border: `1.5px solid ${border}`, color, backdropFilter: 'blur(6px)' }}>
              <span className="font-bold mr-2" style={{ color: '#93c5fd' }}>{['A', 'B', 'C', 'D'][i]}.</span>
              {op}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="text-center text-2xl animate-bounce">
          {feedback === 'ok' ? '✅' : '❌'}
        </div>
      )}
    </div>
  )
}

// ─── PANTALLA TRANSICIÓN ENTRE NIVELES ───────────────────────────────────────
function PantallaTransicion({ nivel, correctas, respondidas, puntosAcumulados, onContinuar, onFinal }) {
  const pts = puntosAcumulados
  const per = getPersonaje(pts)
  const siguiente = getNextPersonaje(pts)
  const esUltimo = nivel >= 3

  return (
    <div className="flex flex-col items-center text-center px-4 py-8 gap-5">
      <div className="text-7xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>{per.emoji}</div>
      <div>
        <p className="text-xs font-bold mb-1" style={{ color: '#93c5fd' }}>¡NIVEL {nivel} COMPLETADO!</p>
        <h2 className="text-xl font-black" style={{ color: '#1e3a5f' }}>{per.nombre}</h2>
        <p className="text-sm mt-1" style={{ color: '#6b9fd4' }}>"{per.desc}"</p>
      </div>
      <div className="rounded-2xl p-4 w-full space-y-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6b9fd4' }}>Correctas este nivel:</span>
          <span className="font-black" style={{ color: '#1d4ed8' }}>{correctas} / {respondidas}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#6b9fd4' }}>Puntos acumulados:</span>
          <span className="font-black" style={{ color: '#1d4ed8' }}>{pts}</span>
        </div>
        {siguiente && (
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6b9fd4' }}>Siguiente nivel:</span>
            <span className="font-bold" style={{ color: '#16a34a' }}>{siguiente.emoji} {siguiente.nombre} (en {siguiente.min - pts} pts)</span>
          </div>
        )}
      </div>
      {!esUltimo ? (
        <button onClick={onContinuar} className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
          style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
          Nivel {nivel + 1} — {nivel === 1 ? '🟡 Intermedio' : '🔴 Experto'} →
        </button>
      ) : (
        <button onClick={onFinal} className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
          style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
          Ver resultado final 🏆
        </button>
      )}
    </div>
  )
}

// ─── PANTALLA RESULTADO FINAL ─────────────────────────────────────────────────
function PantallaFinal({ historial, puntosTotal, onReiniciar }) {
  const per = getPersonaje(puntosTotal)
  const pctMax = Math.max(...historial.map(h => h.respondidas || 1))

  // Animación de evolución
  const [frameIdx, setFrameIdx] = useState(0)
  const frames = PERSONAJES.filter(p => p.min <= puntosTotal)
  useEffect(() => {
    if (frameIdx < frames.length - 1) {
      const t = setTimeout(() => setFrameIdx(i => i + 1), 300)
      return () => clearTimeout(t)
    }
  }, [frameIdx])

  return (
    <div className="flex flex-col items-center text-center px-4 py-6 gap-5">
      {/* Evolución animada */}
      <div>
        <div className="text-7xl mb-2" style={{ filter: 'drop-shadow(0 4px 16px rgba(37,99,235,0.25))' }}>
          {frames[frameIdx]?.emoji || per.emoji}
        </div>
        <div className="flex justify-center gap-0.5 mb-2">
          {frames.map((f, i) => (
            <span key={f.id} className="text-base transition-all" style={{ opacity: i <= frameIdx ? 1 : 0.2 }}>{f.emoji}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold mb-0.5" style={{ color: '#93c5fd' }}>RESULTADO FINAL</p>
        <h2 className="text-2xl font-black" style={{ color: '#1e3a5f' }}>{per.nombre}</h2>
        <p className="text-sm mt-1 italic" style={{ color: '#6b9fd4' }}>"{per.desc}"</p>
      </div>

      {/* Puntos */}
      <div className="rounded-2xl p-4 w-full" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <p className="text-3xl font-black mb-1" style={{ color: '#1d4ed8' }}>{puntosTotal} puntos</p>
        <p className="text-xs" style={{ color: '#6b9fd4' }}>Nivel alcanzado: {per.emoji} {per.nombre}</p>
      </div>

      {/* Historial por nivel */}
      <div className="w-full space-y-2">
        {historial.map((h, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.75)', border: '0.5px solid #bfdbfe' }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold" style={{ color: '#1e3a5f' }}>{['🟢 Básico', '🟡 Intermedio', '🔴 Experto'][i]}</span>
              <span className="text-xs font-black" style={{ color: '#1d4ed8' }}>{h.correctas}/{h.respondidas}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#dbeafe' }}>
              <div className="h-full rounded-full" style={{ width: `${h.respondidas ? (h.correctas / h.respondidas) * 100 : 0}%`, background: ['#16a34a', '#ca8a04', '#dc2626'][i] }} />
            </div>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <div className="w-full rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid #bfdbfe' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#1e3a5f' }}>Escala de evolución</p>
        <div className="grid grid-cols-5 gap-1">
          {PERSONAJES.map(p => (
            <div key={p.id} className="flex flex-col items-center p-1 rounded-lg transition-all"
              style={{ background: puntosTotal >= p.min ? 'rgba(37,99,235,0.1)' : 'transparent', border: per.id === p.id ? '1.5px solid #2563eb' : '1.5px solid transparent' }}>
              <span className="text-xl" style={{ opacity: puntosTotal >= p.min ? 1 : 0.25 }}>{p.emoji}</span>
              <span className="text-[7px] leading-tight text-center" style={{ color: puntosTotal >= p.min ? '#1d4ed8' : '#93c5fd' }}>{p.nombre.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onReiniciar} className="w-full py-3 rounded-2xl text-white font-black text-base active:scale-95 transition-all"
        style={{ background: '#2563eb', boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}>
        🔄 Jugar de nuevo
      </button>
    </div>
  )
}

// ─── SHUFFLE ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL DEL JUEGO
// ═══════════════════════════════════════════════════════════════════════════════
export default function QuimicaGamePage() {
  const [pantalla, setPantalla] = useState('inicio') // inicio | nivel | transicion | final
  const [nivel, setNivel] = useState(1)
  const [preguntasActuales, setPreguntasActuales] = useState([])
  const [historial, setHistorial] = useState([])
  const [puntosTotal, setPuntosTotal] = useState(0)
  const [ultimoResultado, setUltimoResultado] = useState(null)

  function iniciar() {
    setHistorial([])
    setPuntosTotal(0)
    setNivel(1)
    setPreguntasActuales(shuffle(PREGUNTAS[1]))
    setPantalla('nivel')
  }

  function terminarNivel(correctas, respondidas) {
    const puntos = correctas * 3
    const nuevoPuntosTotal = puntosTotal + puntos
    const entrada = { nivel, correctas, respondidas, puntos }
    setHistorial(h => [...h, entrada])
    setPuntosTotal(nuevoPuntosTotal)
    setUltimoResultado({ correctas, respondidas })
    setPantalla('transicion')
  }

  function siguienteNivel() {
    const n = nivel + 1
    setNivel(n)
    setPreguntasActuales(shuffle(PREGUNTAS[n]))
    setPantalla('nivel')
  }

  function irAFinal() {
    setPantalla('final')
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen" style={{ paddingBottom: 100 }}>
      <div className="rounded-2xl overflow-hidden shadow-sm mx-3 mt-3" style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(147,197,253,0.5)' }}>
        {pantalla === 'inicio' && <PantallaInicio onStart={iniciar} />}
        {pantalla === 'nivel' && (
          <PantallaNivel key={`nivel-${nivel}`} nivel={nivel} preguntas={preguntasActuales} onTerminar={terminarNivel} />
        )}
        {pantalla === 'transicion' && ultimoResultado && (
          <PantallaTransicion
            nivel={nivel}
            correctas={ultimoResultado.correctas}
            respondidas={ultimoResultado.respondidas}
            puntosAcumulados={puntosTotal}
            onContinuar={siguienteNivel}
            onFinal={irAFinal}
          />
        )}
        {pantalla === 'final' && (
          <PantallaFinal historial={historial} puntosTotal={puntosTotal} onReiniciar={iniciar} />
        )}
      </div>
    </div>
  )
}
