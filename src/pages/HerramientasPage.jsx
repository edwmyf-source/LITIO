import { useState } from 'react'
import { Calculator, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Constantes 2026 ──────────────────────────────────────────────────────────
const SMMLV_DEFAULT = 1_750_905  // SMMLV 2026 Colombia (Decreto 0159 feb 2026)
const ARL_PCTS = { 1: 0.00522, 2: 0.01044, 3: 0.02436, 4: 0.04350, 5: 0.06960 }
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cop = v => '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const num = s => Number(String(s).replace(/[^0-9]/g, '')) || 0
const formatInput = v => { const n = num(v); return n ? cop(n) : '' }

function fspPct(ibc, sm) {
  const r = sm > 0 ? ibc / sm : 0
  if (r < 4)  return 0
  if (r < 7)  return 0.015
  if (r < 11) return 0.018
  if (r < 19) return 0.025
  if (r <= 20) return 0.028
  return 0.03
}

function calcServ(h, arlPct, sm) {
  const ibc = Math.max(h * 0.4, sm)
  const sa = ibc * 0.125, pe = ibc * 0.125, ar = ibc * arlPct
  const fs = ibc * fspPct(ibc, sm)
  return { ing: h, ibc, salud: -sa, pension: -pe, arl: -ar, fsp: -fs, total: h - (sa + pe + ar + fs) }
}

function calcLab(s, sm) {
  const ibc = Math.max(s, sm)
  const fs = ibc * fspPct(ibc, sm)
  const sa = ibc * 0.04, pe = ibc * 0.04
  const pr = ibc * 0.0833, ce = ibc * 0.0833, ic = ibc * 0.01, va = ibc * 0.041666
  return { ing: s, ibc, salud: -sa, pension: -pe, fsp: -fs, prima: pr, cesantias: ce, intCes: ic, vacaciones: va, total: s - (sa + pe + fs) + pr + ce + ic + va }
}

function buscar(objetivo, tipo, arlPct, sm) {
  let lo = 0, hi = objetivo * 10
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2
    const tot = tipo === 'lab' ? calcLab(mid, sm).total : calcServ(mid, arlPct, sm).total
    if (tot > objetivo) hi = mid; else lo = mid
  }
  return (lo + hi) / 2
}

// ─── Fila de tabla ─────────────────────────────────────────────────────────────
function Fila({ label, ps, lab, highlight }) {
  return (
    <tr className={highlight ? 'font-bold text-brand-700 bg-brand-50' : 'border-t border-neutral-100'}>
      <td className="py-2 px-3 text-sm">{label}</td>
      <td className="py-2 px-3 text-right text-sm tabular-nums">{cop(ps)}</td>
      <td className="py-2 px-3 text-right text-sm tabular-nums">{cop(lab)}</td>
    </tr>
  )
}

// ─── Tab Mensual ───────────────────────────────────────────────────────────────
function TabMensual() {
  const [tipo, setTipo] = useState('servicios')
  const [ingreso, setIngreso] = useState('')
  const [arl, setArl] = useState('1')
  const [sm, setSm] = useState(cop(SMMLV_DEFAULT))
  const [resultado, setResultado] = useState(null)

  function calcular() {
    const v = num(ingreso), smVal = num(sm) || SMMLV_DEFAULT, arlPct = ARL_PCTS[arl] || ARL_PCTS[1]
    if (!v) return
    if (tipo === 'servicios') {
      const s = calcServ(v, arlPct, smVal)
      const eq = buscar(s.total, 'lab', arlPct, smVal)
      const l = calcLab(eq, smVal)
      setResultado({ tipo, s, l, eq, neto: s.total })
    } else {
      const l = calcLab(v, smVal)
      const eq = buscar(l.total, 's', arlPct, smVal)
      const s = calcServ(eq, arlPct, smVal)
      setResultado({ tipo, s, l, eq, neto: l.total })
    }
  }

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Tipo de contrato actual</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="servicios">Prestación de servicios (honorarios)</option>
            <option value="laboral">Contrato laboral (salario)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">
            {tipo === 'servicios' ? 'Honorario mensual' : 'Salario mensual'}
          </label>
          <input value={ingreso} onChange={e => setIngreso(formatInput(e.target.value))}
            placeholder="$0" inputMode="numeric"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">SMMLV 2026</label>
          <input value={sm} onChange={e => setSm(formatInput(e.target.value))}
            placeholder={cop(SMMLV_DEFAULT)} inputMode="numeric"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Clase de riesgo ARL</label>
          <select value={arl} onChange={e => setArl(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="1">Clase I — 0.522% (oficina, admin)</option>
            <option value="2">Clase II — 1.044% (lab, comercio)</option>
            <option value="3">Clase III — 2.436% (química, técnico)</option>
            <option value="4">Clase IV — 4.350% (minería, petróleo)</option>
            <option value="5">Clase V — 6.960% (explosivos, alta peligrosidad)</option>
          </select>
        </div>
      </div>

      <button onClick={calcular}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">
        Calcular equivalencia
      </button>

      {/* Resultado */}
      {resultado && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-brand-600 font-semibold mb-1">Tu ingreso neto mensual</p>
            <p className="text-3xl font-black text-brand-700">{cop(resultado.neto)}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Para igualarlo con {resultado.tipo === 'servicios' ? 'contrato laboral' : 'prestación de servicios'} necesitarías{' '}
              <strong className="text-brand-700">{cop(resultado.eq)}</strong> de{' '}
              {resultado.tipo === 'servicios' ? 'salario base' : 'honorarios'}.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Concepto</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-sky-600">Prestación servicios</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-violet-600">Contrato laboral</th>
                </tr>
              </thead>
              <tbody>
                <Fila label="Ingreso / honorario" ps={resultado.s.ing} lab={resultado.l.ing} />
                <Fila label="IBC (base de cotización)" ps={resultado.s.ibc} lab={resultado.l.ibc} />
                <Fila label="Salud (aporte)" ps={resultado.s.salud} lab={resultado.l.salud} />
                <Fila label="Pensión (aporte)" ps={resultado.s.pension} lab={resultado.l.pension} />
                <Fila label="ARL" ps={resultado.s.arl} lab={0} />
                <Fila label="Fondo Solidaridad Pensional" ps={resultado.s.fsp} lab={resultado.l.fsp} />
                <Fila label="Prima" ps={0} lab={resultado.l.prima} />
                <Fila label="Cesantías" ps={0} lab={resultado.l.cesantias} />
                <Fila label="Intereses cesantías" ps={0} lab={resultado.l.intCes} />
                <Fila label="Vacaciones" ps={0} lab={resultado.l.vacaciones} />
                <Fila label="TOTAL NETO AL MES" ps={resultado.s.total} lab={resultado.l.total} highlight />
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-400 text-center">
            * Cálculo orientativo. Consulta a tu contador para cifras exactas.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab Anual ─────────────────────────────────────────────────────────────────
function TabAnual() {
  const [arl, setArl] = useState('1')
  const [sm, setSm] = useState(cop(SMMLV_DEFAULT))
  const [ingresos, setIngresos] = useState(Array(12).fill(''))
  const [resultado, setResultado] = useState(null)

  function setMes(i, v) {
    const arr = [...ingresos]; arr[i] = formatInput(v); setIngresos(arr)
  }

  function calcular() {
    const smVal = num(sm) || SMMLV_DEFAULT
    const arlPct = ARL_PCTS[arl] || ARL_PCTS[1]
    const vals = ingresos.map(v => num(v))
    if (vals.every(v => v <= 0)) return alert('Ingresa al menos un mes con valor')

    const netosPS = vals.map(v => v > 0 ? calcServ(v, arlPct, smVal).total : 0)
    const totalAnual = netosPS.reduce((a, b) => a + b, 0)
    const mesesActivos = vals.filter(v => v > 0).length
    const promedio12 = totalAnual / 12
    const promedioActivo = totalAnual / mesesActivos

    // Salario laboral que produce el mismo neto promedio mensual (sobre 12 meses)
    const salEq = buscar(promedio12, 'lab', arlPct, smVal)
    const detLab = calcLab(salEq, smVal)

    setResultado({ netosPS, totalAnual, promedio12, promedioActivo, salEq, detLab, arlPct, smVal })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">SMMLV 2026</label>
          <input value={sm} onChange={e => setSm(formatInput(e.target.value))}
            placeholder={cop(SMMLV_DEFAULT)} inputMode="numeric"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Clase de riesgo ARL</label>
          <select value={arl} onChange={e => setArl(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="1">Clase I — 0.522%</option>
            <option value="2">Clase II — 1.044%</option>
            <option value="3">Clase III — 2.436%</option>
            <option value="4">Clase IV — 4.350%</option>
            <option value="5">Clase V — 6.960%</option>
          </select>
        </div>
      </div>

      {/* Tabla de 12 meses */}
      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Mes</th>
              <th className="py-2 px-3 text-right text-xs font-bold text-sky-600">Honorario (prestación)</th>
            </tr>
          </thead>
          <tbody>
            {MESES.map((m, i) => (
              <tr key={m} className="border-t border-neutral-100">
                <td className="py-2 px-3 text-sm text-neutral-600">{m}</td>
                <td className="py-1 px-3">
                  <input value={ingresos[i]}
                    onChange={e => setMes(i, e.target.value)}
                    placeholder="$0" inputMode="numeric"
                    className="w-full text-right border border-neutral-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={calcular}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">
        Calcular equivalencia anual
      </button>

      {/* Resultado anual */}
      {resultado && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Neto anual (PS)', value: cop(resultado.totalAnual), color: 'text-sky-700 bg-sky-50 border-sky-200' },
              { label: 'Promedio 12 meses (PS)', value: cop(resultado.promedio12), color: 'text-sky-700 bg-sky-50 border-sky-200' },
              { label: 'Promedio meses activos', value: cop(resultado.promedioActivo), color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Salario laboral equivalente', value: cop(resultado.salEq), color: 'text-violet-700 bg-violet-50 border-violet-200' },
            ].map(item => (
              <div key={item.label} className={`border rounded-2xl p-3 text-center ${item.color}`}>
                <p className="text-xs font-semibold mb-1 opacity-70">{item.label}</p>
                <p className="text-lg font-black">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Mes</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-sky-600">Neto PS</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-violet-600">Equiv. laboral</th>
                </tr>
              </thead>
              <tbody>
                {MESES.map((m, i) => (
                  <tr key={m} className="border-t border-neutral-100">
                    <td className="py-2 px-3 text-sm">{m}</td>
                    <td className="py-2 px-3 text-right text-sm tabular-nums text-sky-700">{resultado.netosPS[i] > 0 ? cop(resultado.netosPS[i]) : '—'}</td>
                    <td className="py-2 px-3 text-right text-sm tabular-nums text-violet-700">{resultado.detLab ? cop(resultado.detLab.total) : '—'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-neutral-300 font-bold">
                  <td className="py-2 px-3 text-sm text-brand-700">TOTAL / MES EQ.</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums text-sky-700">{cop(resultado.totalAnual)}</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums text-violet-700">{cop(resultado.detLab.total * 12)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-400 text-center">
            * El equivalente laboral asume ingresos uniformes los 12 meses. Consulta a tu contador.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Acordeón FAQ ──────────────────────────────────────────────────────────────
function FAQ({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition">
        {pregunta}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <p className="px-4 pb-4 text-sm text-neutral-600 leading-relaxed">{respuesta}</p>}
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function HerramientasPage() {
  const [tab, setTab] = useState('mensual')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={22} className="text-brand-600" />
          <h1 className="text-xl font-black text-neutral-800">Herramientas</h1>
        </div>
        <p className="text-sm text-neutral-500">Calculadoras y recursos para contratistas del sector químico.</p>
      </div>

      {/* Card calculadora */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab nav */}
        <div className="flex border-b border-neutral-200">
          {[
            { id: 'mensual', label: '💰 Mensual', icon: Calculator },
            { id: 'anual',   label: '📅 Anual',   icon: TrendingUp },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-bold transition ${tab === t.id
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-neutral-500 hover:text-neutral-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Título */}
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-black text-neutral-800 text-base">
            {tab === 'mensual' ? 'Honorario vs Salario — equivalencia mensual' : 'Análisis de ingresos anuales (prestación de servicios)'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {tab === 'mensual'
              ? '¿Cuánto salario equivale a tu honorario? O al revés. Descúbrelo en segundos.'
              : 'Ingresa lo que ganaste cada mes y calcula a qué salario laboral equivaldría.'}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {tab === 'mensual' ? <TabMensual /> : <TabAnual />}
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Los cálculos usan las tarifas 2026 vigentes en Colombia: SMMLV $1.750.905 (Decreto 0159/2026). Salud 12.5% IBC (contratista) / 4% (empleado),
          pensión 12.5% / 4%, ARL según clase de riesgo, y Fondo de Solidaridad Pensional para IBC ≥ 4 SMMLV.
          El contrato laboral incluye prima, cesantías, intereses de cesantías y vacaciones proporcionales.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <h3 className="font-bold text-neutral-700 text-sm flex items-center gap-2">
          <Info size={15} /> Preguntas frecuentes
        </h3>
        <FAQ pregunta="¿Qué es el IBC en prestación de servicios?"
          respuesta="El IBC (Ingreso Base de Cotización) en prestación de servicios es el 40% del honorario. No puede ser inferior a 1 SMMLV. Sobre ese valor se liquidan salud, pensión, ARL y Fondo de Solidaridad." />
        <FAQ pregunta="¿Por qué el contratista recibe menos en neto aunque el honorario sea igual al salario?"
          respuesta="Porque el contratista paga el 100% de salud (12.5%) y pensión (12.5%), mientras que en contrato laboral el empleador paga la mayor parte. Sin embargo, el contratista cobra todo su honorario sin retención de nómina y debe auto-gestionar sus aportes." />
        <FAQ pregunta="¿Qué incluye el 'total neto' del contrato laboral en la calculadora?"
          respuesta="El total neto laboral suma el salario menos los descuentos (salud 4%, pensión 4%, FSP si aplica) más los beneficios proporcionales mensuales: prima (8.33%), cesantías (8.33%), intereses de cesantías (1%) y vacaciones (4.17%)." />
        <FAQ pregunta="¿Es exacto el cálculo de retención en la fuente?"
          respuesta="Esta calculadora no incluye retención en la fuente sobre honorarios, que varía según el pagador y si presentas declaración. Para cifras exactas, consulta a tu contador o usa el formulario 210 de la DIAN." />
      </div>
    </div>
  )
}
