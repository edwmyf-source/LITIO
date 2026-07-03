import { useState } from 'react'
import { Calculator, TrendingUp, Info, ChevronDown, ChevronUp, FlaskConical, Beaker, Plus, Trash2 } from 'lucide-react'

// ─── Constantes 2026 ──────────────────────────────────────────────────────────
const SMMLV_DEFAULT = 1_750_905
const ARL_PCTS = { 1: 0.00522, 2: 0.01044, 3: 0.02436, 4: 0.04350, 5: 0.06960 }
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Helpers generales ────────────────────────────────────────────────────────
const cop  = v => '$' + (Math.round(v * 10000) / 10000).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const cop0 = v => '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const num  = s => Number(String(s).replace(/[^0-9]/g, '')) || 0
const numF = s => parseFloat(String(s).replace(/,/g, '.')) || 0
const formatMoney = v => { const n = num(v); return n ? cop0(n) : '' }
const fmt4 = v => Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

// ─── Seguridad social ─────────────────────────────────────────────────────────
function fspPct(ibc, sm) {
  const r = sm > 0 ? ibc / sm : 0
  if (r < 4)   return 0
  if (r < 7)   return 0.015
  if (r < 11)  return 0.018
  if (r < 19)  return 0.025
  if (r <= 20) return 0.028
  return 0.03
}
function calcServ(h, arlPct, sm) {
  const ibc = Math.max(h * 0.4, sm)
  const sa = ibc * 0.125, pe = ibc * 0.125, ar = ibc * arlPct, fs = ibc * fspPct(ibc, sm)
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

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN LABORAL
// ═══════════════════════════════════════════════════════════════════════════════
function FilaTabla({ label, ps, lab, highlight }) {
  return (
    <tr className={highlight ? 'font-bold text-brand-700 bg-brand-50' : 'border-t border-neutral-100'}>
      <td className="py-2 px-3 text-sm">{label}</td>
      <td className="py-2 px-3 text-right text-sm tabular-nums">{cop0(ps)}</td>
      <td className="py-2 px-3 text-right text-sm tabular-nums">{cop0(lab)}</td>
    </tr>
  )
}

function TabMensual() {
  const [tipo, setTipo] = useState('servicios')
  const [ingreso, setIngreso] = useState('')
  const [arl, setArl] = useState('1')
  const [sm, setSm] = useState(cop0(SMMLV_DEFAULT))
  const [resultado, setResultado] = useState(null)

  function calcular() {
    const v = num(ingreso), smVal = num(sm) || SMMLV_DEFAULT, arlPct = ARL_PCTS[arl] || ARL_PCTS[1]
    if (!v) return
    if (tipo === 'servicios') {
      const s = calcServ(v, arlPct, smVal), eq = buscar(s.total, 'lab', arlPct, smVal), l = calcLab(eq, smVal)
      setResultado({ tipo, s, l, eq, neto: s.total })
    } else {
      const l = calcLab(v, smVal), eq = buscar(l.total, 's', arlPct, smVal), s = calcServ(eq, arlPct, smVal)
      setResultado({ tipo, s, l, eq, neto: l.total })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Tipo de contrato actual</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="servicios">Prestación de servicios</option>
            <option value="laboral">Contrato laboral</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">{tipo === 'servicios' ? 'Honorario mensual' : 'Salario mensual'}</label>
          <input value={ingreso} onChange={e => setIngreso(formatMoney(e.target.value))} placeholder="$0" inputMode="numeric" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">SMMLV 2026</label>
          <input value={sm} onChange={e => setSm(formatMoney(e.target.value))} placeholder={cop0(SMMLV_DEFAULT)} inputMode="numeric" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Clase de riesgo ARL</label>
          <select value={arl} onChange={e => setArl(e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="1">I — 0.522% (oficina, admin)</option>
            <option value="2">II — 1.044% (lab, comercio)</option>
            <option value="3">III — 2.436% (química, técnico)</option>
            <option value="4">IV — 4.350% (minería, petróleo)</option>
            <option value="5">V — 6.960% (alta peligrosidad)</option>
          </select>
        </div>
      </div>
      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">Calcular equivalencia</button>
      {resultado && (
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-brand-600 font-semibold mb-1">Tu ingreso neto mensual</p>
            <p className="text-3xl font-black text-brand-700">{cop0(resultado.neto)}</p>
            <p className="text-xs text-neutral-500 mt-1">Para igualarlo con {resultado.tipo === 'servicios' ? 'contrato laboral' : 'prestación de servicios'} necesitarías <strong className="text-brand-700">{cop0(resultado.eq)}</strong> de {resultado.tipo === 'servicios' ? 'salario base' : 'honorarios'}.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-50"><tr><th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Concepto</th><th className="py-2 px-3 text-right text-xs font-bold text-sky-600">Prest. servicios</th><th className="py-2 px-3 text-right text-xs font-bold text-violet-600">Contrato laboral</th></tr></thead>
              <tbody>
                <FilaTabla label="Ingreso / honorario" ps={resultado.s.ing} lab={resultado.l.ing} />
                <FilaTabla label="IBC" ps={resultado.s.ibc} lab={resultado.l.ibc} />
                <FilaTabla label="Salud" ps={resultado.s.salud} lab={resultado.l.salud} />
                <FilaTabla label="Pensión" ps={resultado.s.pension} lab={resultado.l.pension} />
                <FilaTabla label="ARL" ps={resultado.s.arl} lab={0} />
                <FilaTabla label="Fondo Solidaridad" ps={resultado.s.fsp} lab={resultado.l.fsp} />
                <FilaTabla label="Prima" ps={0} lab={resultado.l.prima} />
                <FilaTabla label="Cesantías" ps={0} lab={resultado.l.cesantias} />
                <FilaTabla label="Int. cesantías" ps={0} lab={resultado.l.intCes} />
                <FilaTabla label="Vacaciones" ps={0} lab={resultado.l.vacaciones} />
                <FilaTabla label="TOTAL NETO AL MES" ps={resultado.s.total} lab={resultado.l.total} highlight />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 text-center">* Cálculo orientativo. Consulta a tu contador.</p>
        </div>
      )}
    </div>
  )
}

function TabAnual() {
  const [arl, setArl] = useState('1')
  const [sm, setSm] = useState(cop0(SMMLV_DEFAULT))
  const [ingresos, setIngresos] = useState(Array(12).fill(''))
  const [resultado, setResultado] = useState(null)

  function setMes(i, v) { const arr = [...ingresos]; arr[i] = formatMoney(v); setIngresos(arr) }

  function calcular() {
    const smVal = num(sm) || SMMLV_DEFAULT, arlPct = ARL_PCTS[arl] || ARL_PCTS[1]
    const vals = ingresos.map(v => num(v))
    if (vals.every(v => v <= 0)) return alert('Ingresa al menos un mes con valor')
    const netosPS = vals.map(v => v > 0 ? calcServ(v, arlPct, smVal).total : 0)
    const totalAnual = netosPS.reduce((a, b) => a + b, 0)
    const mesesActivos = vals.filter(v => v > 0).length
    const promedio12 = totalAnual / 12
    const promedioActivo = totalAnual / mesesActivos
    const salEq = buscar(promedio12, 'lab', arlPct, smVal)
    const detLab = calcLab(salEq, smVal)
    setResultado({ netosPS, totalAnual, promedio12, promedioActivo, salEq, detLab })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">SMMLV 2026</label>
          <input value={sm} onChange={e => setSm(formatMoney(e.target.value))} placeholder={cop0(SMMLV_DEFAULT)} inputMode="numeric" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Clase de riesgo ARL</label>
          <select value={arl} onChange={e => setArl(e.target.value)} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="1">I — 0.522%</option><option value="2">II — 1.044%</option><option value="3">III — 2.436%</option><option value="4">IV — 4.350%</option><option value="5">V — 6.960%</option>
          </select>
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50"><tr><th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Mes</th><th className="py-2 px-3 text-right text-xs font-bold text-sky-600">Honorario</th></tr></thead>
          <tbody>
            {MESES.map((m, i) => (
              <tr key={m} className="border-t border-neutral-100">
                <td className="py-2 px-3 text-sm text-neutral-600">{m}</td>
                <td className="py-1 px-3"><input value={ingresos[i]} onChange={e => setMes(i, e.target.value)} placeholder="$0" inputMode="numeric" className="w-full text-right border border-neutral-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">Calcular equivalencia anual</button>
      {resultado && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Neto anual (PS)', value: cop0(resultado.totalAnual), color: 'text-sky-700 bg-sky-50 border-sky-200' },
              { label: 'Promedio 12 meses', value: cop0(resultado.promedio12), color: 'text-sky-700 bg-sky-50 border-sky-200' },
              { label: 'Promedio meses activos', value: cop0(resultado.promedioActivo), color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Salario laboral equiv.', value: cop0(resultado.salEq), color: 'text-violet-700 bg-violet-50 border-violet-200' },
            ].map(item => (
              <div key={item.label} className={`border rounded-2xl p-3 text-center ${item.color}`}>
                <p className="text-xs font-semibold mb-1 opacity-70">{item.label}</p>
                <p className="text-lg font-black">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 text-center">* Consulta a tu contador para cifras exactas.</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN QUÍMICA
// ═══════════════════════════════════════════════════════════════════════════════
function CalcDiluciones() {
  const [c1, setC1] = useState(''), [v1, setV1] = useState(''), [c2, setC2] = useState(''), [v2, setV2] = useState('')
  const [incognita, setIncognita] = useState('v1')
  const [res, setRes] = useState(null)

  function calcular() {
    const vals = { c1: numF(c1), v1: numF(v1), c2: numF(c2), v2: numF(v2) }
    let resultado
    if (incognita === 'v1') resultado = (vals.c2 * vals.v2) / vals.c1
    else if (incognita === 'c1') resultado = (vals.c2 * vals.v2) / vals.v1
    else if (incognita === 'c2') resultado = (vals.c1 * vals.v1) / vals.v2
    else resultado = (vals.c1 * vals.v1) / vals.c2
    if (!isFinite(resultado) || resultado <= 0) return alert('Verifica los valores ingresados')
    setRes({ valor: resultado, incognita })
  }

  const labels = { c1: 'Concentración inicial (C₁)', v1: 'Volumen inicial (V₁)', c2: 'Concentración final (C₂)', v2: 'Volumen final (V₂)' }
  const unidades = { c1: '%', v1: 'mL / g', c2: '%', v2: 'mL / g' }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1">¿Qué quiero calcular?</label>
        <select value={incognita} onChange={e => { setIncognita(e.target.value); setRes(null) }} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="v1">V₁ — Volumen a tomar de la solución concentrada</option>
          <option value="c1">C₁ — Concentración de la solución madre</option>
          <option value="c2">C₂ — Concentración final deseada</option>
          <option value="v2">V₂ — Volumen final de la dilución</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['c1','v1','c2','v2'].map(k => (
          <div key={k} className={incognita === k ? 'opacity-40 pointer-events-none' : ''}>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">{labels[k]}</label>
            <div className="flex gap-1">
              <input value={k==='c1'?c1:k==='v1'?v1:k==='c2'?c2:v2}
                onChange={e => ({c1:setC1,v1:setV1,c2:setC2,v2:setV2}[k])(e.target.value)}
                disabled={incognita===k} placeholder={incognita===k?'?':'0'}
                inputMode="decimal" className="flex-1 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-neutral-100" />
              <span className="flex items-center text-xs text-neutral-400 px-2 bg-neutral-50 border border-neutral-200 rounded-xl">{unidades[k]}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">Calcular (C₁V₁ = C₂V₂)</button>
      {res && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-brand-600 font-semibold mb-1">{labels[res.incognita]}</p>
          <p className="text-3xl font-black text-brand-700">{fmt4(res.valor)}</p>
          <p className="text-xs text-neutral-500 mt-1">{res.incognita.startsWith('v') ? 'mL / g' : '%'}</p>
          {res.incognita === 'v1' && <p className="text-xs text-neutral-500 mt-2">Toma <strong>{fmt4(res.valor)} mL/g</strong> y lleva a volumen final con solvente.</p>}
        </div>
      )}
    </div>
  )
}

function CalcConversion() {
  const [valor, setValor] = useState('')
  const [desde, setDesde] = useState('porcPV')
  const [densidad, setDensidad] = useState('1')
  const [pmSoluto, setPmSoluto] = useState('')
  const [res, setRes] = useState(null)

  const unidades = [
    { id: 'porcPV', label: '% p/v  (g/100 mL)' },
    { id: 'porcVV', label: '% v/v  (mL/100 mL)' },
    { id: 'ppmMV', label: 'ppm    (mg/L)' },
    { id: 'mgmL',  label: 'mg/mL' },
    { id: 'gL',    label: 'g/L' },
    { id: 'molL',  label: 'mol/L  (M) — requiere PM' },
  ]

  function convertir() {
    const v = numF(valor), d = numF(densidad) || 1, pm = numF(pmSoluto)
    if (!v) return
    // Convertir todo a g/L primero
    let gL
    if (desde === 'porcPV') gL = v * 10
    else if (desde === 'porcVV') gL = v * d * 10
    else if (desde === 'ppmMV') gL = v / 1000
    else if (desde === 'mgmL') gL = v
    else if (desde === 'gL') gL = v
    else if (desde === 'molL') { if (!pm) return alert('Ingresa el peso molecular'); gL = v * pm }

    const resultados = {
      'g/L': fmt4(gL),
      'mg/mL': fmt4(gL),
      '% p/v (g/100mL)': fmt4(gL / 10),
      '% v/v': fmt4(gL / d / 10),
      'ppm (mg/L)': fmt4(gL * 1000),
      'µg/mL': fmt4(gL * 1000),
    }
    if (pm) resultados['mol/L (M)'] = fmt4(gL / pm)
    setRes(resultados)
  }

  const needsPM = desde === 'molL'
  const needsDens = desde === 'porcVV'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Valor a convertir</label>
          <input value={valor} onChange={e => setValor(e.target.value)} placeholder="0" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Unidad de entrada</label>
          <select value={desde} onChange={e => { setDesde(e.target.value); setRes(null) }} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
            {unidades.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        {(needsDens || desde !== 'molL') && (
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Densidad del soluto (g/mL) <span className="text-neutral-400 font-normal">— para % v/v</span></label>
            <input value={densidad} onChange={e => setDensidad(e.target.value)} placeholder="1.00" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Peso molecular (g/mol) <span className="text-neutral-400 font-normal">— para molar</span></label>
          <input value={pmSoluto} onChange={e => setPmSoluto(e.target.value)} placeholder="opcional" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </div>
      <button onClick={convertir} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">Convertir unidades</button>
      {res && (
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-500">Equivalencias</div>
          {Object.entries(res).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center px-4 py-2.5 border-t border-neutral-100">
              <span className="text-sm text-neutral-600">{k}</span>
              <span className="text-sm font-bold text-brand-700 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CalcPureza() {
  const [masa, setMasa] = useState(''), [pureza, setPureza] = useState(''), [res, setRes] = useState(null)

  function calcular() {
    const m = numF(masa), p = numF(pureza)
    if (!m || !p || p > 100) return alert('Verifica los valores')
    const principioActivo = m * (p / 100)
    const excipiente = m - principioActivo
    setRes({ m, p, principioActivo, excipiente })
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
        <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Calcula cuánto principio activo real hay en una masa de reactivo según su certificado de análisis.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Masa del reactivo (g o kg)</label>
          <input value={masa} onChange={e => setMasa(e.target.value)} placeholder="100" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Pureza del certificado (%)</label>
          <input value={pureza} onChange={e => setPureza(e.target.value)} placeholder="99.5" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </div>
      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">Calcular</button>
      {res && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-3 text-center">
            <p className="text-xs text-brand-600 font-semibold mb-1">Masa total</p>
            <p className="text-xl font-black text-brand-700">{fmt4(res.m)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-semibold mb-1">Principio activo</p>
            <p className="text-xl font-black text-emerald-700">{fmt4(res.principioActivo)}</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-center">
            <p className="text-xs text-neutral-500 font-semibold mb-1">Impurezas / excip.</p>
            <p className="text-xl font-black text-neutral-600">{fmt4(res.excipiente)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function CalcPH() {
  const [tipo, setTipo] = useState('debil')
  const [pKa, setPKa] = useState(''), [cAcido, setCAcido] = useState(''), [cBase, setCBase] = useState('')
  const [concentracion, setConcentracion] = useState('')
  const [res, setRes] = useState(null)

  function calcular() {
    if (tipo === 'buffer') {
      const pka = numF(pKa), ca = numF(cAcido), cb = numF(cBase)
      if (!pka || !ca || !cb) return alert('Completa todos los campos')
      const pH = pka + Math.log10(cb / ca)
      setRes({ pH: fmt4(pH), tipo: 'buffer', pKa: pka, ratio: fmt4(cb / ca) })
    } else {
      const c = numF(concentracion)
      if (!c) return alert('Ingresa la concentración')
      let pH
      if (tipo === 'fuerte_acido') pH = -Math.log10(c)
      else if (tipo === 'fuerte_base') pH = 14 + Math.log10(c)
      else if (tipo === 'debil') {
        const ka = Math.pow(10, -numF(pKa))
        const h = (-ka + Math.sqrt(ka * ka + 4 * ka * c)) / 2
        pH = -Math.log10(h)
      }
      setRes({ pH: fmt4(pH), tipo })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1">Tipo de cálculo</label>
        <select value={tipo} onChange={e => { setTipo(e.target.value); setRes(null) }} className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="fuerte_acido">Ácido fuerte — pH = -log[H⁺]</option>
          <option value="fuerte_base">Base fuerte — pH = 14 + log[OH⁻]</option>
          <option value="debil">Ácido débil — equilibrio Ka</option>
          <option value="buffer">Buffer — Henderson-Hasselbalch</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(tipo === 'fuerte_acido' || tipo === 'fuerte_base' || tipo === 'debil') && (
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Concentración (mol/L)</label>
            <input value={concentracion} onChange={e => setConcentracion(e.target.value)} placeholder="0.1" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        )}
        {(tipo === 'debil' || tipo === 'buffer') && (
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">pKa del ácido</label>
            <input value={pKa} onChange={e => setPKa(e.target.value)} placeholder="4.76" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        )}
        {tipo === 'buffer' && (<>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">[Ácido] (mol/L)</label>
            <input value={cAcido} onChange={e => setCAcido(e.target.value)} placeholder="0.1" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">[Base conjugada] (mol/L)</label>
            <input value={cBase} onChange={e => setCBase(e.target.value)} placeholder="0.1" inputMode="decimal" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </>)}
      </div>
      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">Calcular pH</button>
      {res && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-brand-600 font-semibold mb-1">pH calculado</p>
          <p className="text-4xl font-black text-brand-700">{res.pH}</p>
          {res.tipo === 'buffer' && <p className="text-xs text-neutral-500 mt-1">pH = pKa ({res.pKa}) + log({res.ratio}) · Henderson-Hasselbalch</p>}
          <div className="mt-2 flex justify-center gap-2 text-xs">
            {[2,4,6,7,8,10,12].map(v => <span key={v} className={`px-1.5 py-0.5 rounded ${Math.abs(numF(res.pH)-v)<0.5?'bg-brand-600 text-white':'bg-white border border-neutral-200 text-neutral-400'}`}>{v}</span>)}
          </div>
          <p className="text-xs text-neutral-400 mt-1">← ácido · neutro · básico →</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN FORMULACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const ID_SEQ = { v: 1 }
function newId() { return ID_SEQ.v++ }

function TabCostoMP() {
  const [ingredientes, setIngredientes] = useState([
    { id: newId(), nombre: '', costo: '', pureza: '100', porcentaje: '' }
  ])
  const [totalBatch, setTotalBatch] = useState('1000')
  const [res, setRes] = useState(null)

  function addIng() {
    setIngredientes(prev => [...prev, { id: newId(), nombre: '', costo: '', pureza: '100', porcentaje: '' }])
  }
  function removeIng(id) { setIngredientes(prev => prev.filter(i => i.id !== id)) }
  function updateIng(id, field, value) {
    setIngredientes(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function calcular() {
    const batch = numF(totalBatch) || 1000
    const filas = ingredientes.map(ing => {
      const costoPorKg = numF(ing.costo)         // $/kg del ingrediente
      const pureza     = numF(ing.pureza) / 100   // fracción
      const pctFormula = numF(ing.porcentaje) / 100 // fracción en fórmula p/p
      const masaEnBatch = batch * pctFormula       // gramos en el batch
      // Costo real: si la pureza es 90%, necesito más gramos para tener la misma cantidad activa
      const costoUnitario = costoPorKg / 1000      // $/g
      const costoIngrediente = masaEnBatch * costoUnitario  // costo del ing en el batch
      return { ...ing, masaEnBatch, costoIngrediente, pctFormula, costoPorKg, pureza }
    })
    const totalPct = filas.reduce((a, f) => a + f.pctFormula * 100, 0)
    const totalCostoBatch = filas.reduce((a, f) => a + f.costoIngrediente, 0)
    const costoPorGramo = totalCostoBatch / batch
    const costoPorKg = costoPorGramo * 1000
    setRes({ filas, totalPct, totalCostoBatch, costoPorGramo, costoPorKg, batch })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1">Tamaño del batch (g)</label>
        <input value={totalBatch} onChange={e => setTotalBatch(e.target.value)} placeholder="1000" inputMode="decimal"
          className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        <p className="text-xs text-neutral-400 mt-1">Ejemplo: 1000 g = 1 kg de producto terminado</p>
      </div>

      {/* Tabla de ingredientes */}
      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 grid grid-cols-12 gap-1 px-3 py-2 text-xs font-bold text-neutral-500">
          <span className="col-span-3">Ingrediente</span>
          <span className="col-span-3 text-right">$/kg</span>
          <span className="col-span-2 text-right">Pureza %</span>
          <span className="col-span-3 text-right">% p/p fórmula</span>
          <span className="col-span-1"></span>
        </div>
        {ingredientes.map((ing, idx) => (
          <div key={ing.id} className="grid grid-cols-12 gap-1 px-3 py-2 border-t border-neutral-100 items-center">
            <input value={ing.nombre} onChange={e => updateIng(ing.id, 'nombre', e.target.value)}
              placeholder={`Ingrediente ${idx+1}`}
              className="col-span-3 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-400" />
            <input value={ing.costo} onChange={e => updateIng(ing.id, 'costo', e.target.value)}
              placeholder="0" inputMode="decimal"
              className="col-span-3 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-brand-400" />
            <input value={ing.pureza} onChange={e => updateIng(ing.id, 'pureza', e.target.value)}
              placeholder="100" inputMode="decimal"
              className="col-span-2 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-brand-400" />
            <input value={ing.porcentaje} onChange={e => updateIng(ing.id, 'porcentaje', e.target.value)}
              placeholder="0" inputMode="decimal"
              className="col-span-3 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-brand-400" />
            <button onClick={() => removeIng(ing.id)} className="col-span-1 flex justify-center text-red-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addIng} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-300 text-brand-600 font-semibold py-2.5 rounded-xl hover:bg-brand-50 transition text-sm">
        <Plus size={15} /> Agregar ingrediente
      </button>

      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">
        Calcular costo de formulación
      </button>

      {res && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-3 text-center">
              <p className="text-xs text-brand-600 font-semibold mb-1">Costo batch ({res.batch}g)</p>
              <p className="text-lg font-black text-brand-700">{cop(res.totalCostoBatch)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Costo por gramo</p>
              <p className="text-lg font-black text-emerald-700">{cop(res.costoPorGramo)}</p>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 text-center">
              <p className="text-xs text-violet-600 font-semibold mb-1">Costo por kg</p>
              <p className="text-lg font-black text-violet-700">{cop(res.costoPorKg)}</p>
            </div>
          </div>

          {/* Detalle por ingrediente */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Ingrediente</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-neutral-500">% fórmula</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-neutral-500">Masa en batch</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-neutral-500">Costo parcial</th>
                  <th className="py-2 px-3 text-right text-xs font-bold text-neutral-500">% costo</th>
                </tr>
              </thead>
              <tbody>
                {res.filas.map((f, i) => (
                  <tr key={i} className="border-t border-neutral-100">
                    <td className="py-2 px-3 text-sm">{f.nombre || `Ing. ${i+1}`}</td>
                    <td className="py-2 px-3 text-right text-sm tabular-nums">{fmt4(f.pctFormula*100)}%</td>
                    <td className="py-2 px-3 text-right text-sm tabular-nums">{fmt4(f.masaEnBatch)} g</td>
                    <td className="py-2 px-3 text-right text-sm tabular-nums">{cop(f.costoIngrediente)}</td>
                    <td className="py-2 px-3 text-right text-sm tabular-nums">{fmt4(f.costoIngrediente/res.totalCostoBatch*100)}%</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-neutral-300 font-bold">
                  <td className="py-2 px-3 text-sm text-brand-700">TOTAL</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums text-brand-700">{fmt4(res.totalPct)}%</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums text-brand-700">{fmt4(res.batch)} g</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums text-brand-700">{cop(res.totalCostoBatch)}</td>
                  <td className="py-2 px-3 text-right text-sm text-brand-700">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          {Math.abs(res.totalPct - 100) > 0.01 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">La suma de porcentajes es <strong>{fmt4(res.totalPct)}%</strong>. Debe ser 100% para una fórmula completa. Verifica o agrega ingrediente completador (agua, vehículo).</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabPresentaciones() {
  const [costoPorKg, setCostoPorKg] = useState('')
  const [margen, setMargen] = useState('')
  const [presentaciones, setPresentaciones] = useState([
    { id: newId(), label: '60 g',  gramos: '60' },
    { id: newId(), label: '100 g', gramos: '100' },
    { id: newId(), label: '250 g', gramos: '250' },
    { id: newId(), label: '500 g', gramos: '500' },
    { id: newId(), label: '1 kg',  gramos: '1000' },
  ])
  const [res, setRes] = useState(null)

  function addPres() { setPresentaciones(prev => [...prev, { id: newId(), label: '', gramos: '' }]) }
  function removePres(id) { setPresentaciones(prev => prev.filter(p => p.id !== id)) }
  function updatePres(id, field, value) { setPresentaciones(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p)) }

  function calcular() {
    const cpk = numF(costoPorKg)
    if (!cpk) return alert('Ingresa el costo por kg')
    const costoPorGramo = cpk / 1000
    const mg = numF(margen) / 100
    const filas = presentaciones.map(p => {
      const g = numF(p.gramos)
      const costoMP = g * costoPorGramo
      const precioVenta = mg > 0 ? costoMP / (1 - mg) : 0
      return { ...p, g, costoMP, precioVenta }
    }).filter(p => p.g > 0)
    setRes({ filas, costoPorGramo, mg })
  }

  return (
    <div className="space-y-4">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex gap-2">
        <Info size={14} className="text-sky-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-800">Ingresa el costo de materia prima por kg del producto terminado (resultado de la calculadora anterior) y define tus presentaciones comerciales.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Costo MP por kg ($)</label>
          <input value={costoPorKg} onChange={e => setCostoPorKg(e.target.value)} placeholder="0" inputMode="decimal"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Margen de venta (%) <span className="text-neutral-400 font-normal">opcional</span></label>
          <input value={margen} onChange={e => setMargen(e.target.value)} placeholder="30" inputMode="decimal"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </div>

      {/* Presentaciones */}
      <div className="rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 grid grid-cols-11 gap-1 px-3 py-2 text-xs font-bold text-neutral-500">
          <span className="col-span-5">Nombre presentación</span>
          <span className="col-span-5 text-right">Gramos</span>
          <span className="col-span-1"></span>
        </div>
        {presentaciones.map(p => (
          <div key={p.id} className="grid grid-cols-11 gap-1 px-3 py-2 border-t border-neutral-100 items-center">
            <input value={p.label} onChange={e => updatePres(p.id, 'label', e.target.value)}
              placeholder="60 g" className="col-span-5 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-400" />
            <input value={p.gramos} onChange={e => updatePres(p.id, 'gramos', e.target.value)}
              placeholder="60" inputMode="decimal" className="col-span-5 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-brand-400" />
            <button onClick={() => removePres(p.id)} className="col-span-1 flex justify-center text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <button onClick={addPres} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-300 text-brand-600 font-semibold py-2.5 rounded-xl hover:bg-brand-50 transition text-sm">
        <Plus size={15} /> Agregar presentación
      </button>
      <button onClick={calcular} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition text-sm">
        Calcular costo por presentación
      </button>

      {res && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-bold text-neutral-500">Presentación</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-neutral-500">Gramos</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-sky-600">Costo MP</th>
                {res.mg > 0 && <th className="py-2 px-3 text-right text-xs font-bold text-emerald-600">Precio venta ({numF(margen)}% margen)</th>}
              </tr>
            </thead>
            <tbody>
              {res.filas.map((f, i) => (
                <tr key={i} className="border-t border-neutral-100">
                  <td className="py-2 px-3 text-sm font-semibold">{f.label || `${f.g}g`}</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums">{fmt4(f.g)} g</td>
                  <td className="py-2 px-3 text-right text-sm tabular-nums font-bold text-sky-700">{cop(f.costoMP)}</td>
                  {res.mg > 0 && <td className="py-2 px-3 text-right text-sm tabular-nums font-bold text-emerald-700">{cop(f.precioVenta)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACORDEÓN FAQ
// ═══════════════════════════════════════════════════════════════════════════════
function FAQ({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition">
        {pregunta}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <p className="px-4 pb-4 text-sm text-neutral-600 leading-relaxed">{respuesta}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const SECCIONES = [
  { id: 'laboral',     icon: '💼', label: 'Laboral' },
  { id: 'quimico',    icon: '🧪', label: 'Químico' },
  { id: 'formulacion', icon: '⚗️', label: 'Formulación' },
]

const TABS_LABORAL     = [{ id: 'mensual', label: '💰 Mensual' }, { id: 'anual', label: '📅 Anual' }]
const TABS_QUIMICO     = [{ id: 'diluciones', label: '💧 Diluciones' }, { id: 'conversion', label: '🔄 Unidades' }, { id: 'pureza', label: '🎯 Pureza' }, { id: 'ph', label: '⚗️ pH' }]
const TABS_FORMULACION = [{ id: 'costo_mp', label: '🧮 Costo MP' }, { id: 'presentaciones', label: '📦 Presentaciones' }]

export default function HerramientasPage() {
  const [seccion, setSeccion] = useState('laboral')
  const [tabLaboral,     setTabLaboral]     = useState('mensual')
  const [tabQuimico,     setTabQuimico]     = useState('diluciones')
  const [tabFormulacion, setTabFormulacion] = useState('costo_mp')

  const tabs    = seccion === 'laboral' ? TABS_LABORAL : seccion === 'quimico' ? TABS_QUIMICO : TABS_FORMULACION
  const tabAct  = seccion === 'laboral' ? tabLaboral : seccion === 'quimico' ? tabQuimico : tabFormulacion
  const setTab  = seccion === 'laboral' ? setTabLaboral : seccion === 'quimico' ? setTabQuimico : setTabFormulacion

  const titulo = {
    mensual: 'Honorario vs Salario — equivalencia mensual',
    anual: 'Análisis anual de ingresos por prestación de servicios',
    diluciones: 'Diluciones — C₁V₁ = C₂V₂',
    conversion: 'Conversión de unidades de concentración',
    pureza: 'Principio activo real según certificado de análisis',
    ph: 'Cálculo de pH y soluciones buffer',
    costo_mp: 'Costo de materia prima en la formulación',
    presentaciones: 'Costo por presentación comercial',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={22} className="text-brand-600" />
          <h1 className="text-xl font-black text-neutral-800">Herramientas</h1>
        </div>
        <p className="text-sm text-neutral-500">Calculadoras para contratistas y formuladores del sector químico.</p>
      </div>

      {/* Selector de sección */}
      <div className="flex gap-2">
        {SECCIONES.map(s => (
          <button key={s.id} onClick={() => setSeccion(s.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border ${seccion === s.id
              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300'}`}>
            <span className="block text-base leading-none mb-0.5">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Card calculadora */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex border-b border-neutral-200 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-bold transition whitespace-nowrap ${tabAct === t.id
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-neutral-500 hover:text-neutral-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Título */}
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-black text-neutral-800 text-base">{titulo[tabAct]}</h2>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {tabAct === 'mensual'        && <TabMensual />}
          {tabAct === 'anual'          && <TabAnual />}
          {tabAct === 'diluciones'     && <CalcDiluciones />}
          {tabAct === 'conversion'     && <CalcConversion />}
          {tabAct === 'pureza'         && <CalcPureza />}
          {tabAct === 'ph'             && <CalcPH />}
          {tabAct === 'costo_mp'       && <TabCostoMP />}
          {tabAct === 'presentaciones' && <TabPresentaciones />}
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Laboral:</strong> Tarifas 2026 — SMMLV $1.750.905 (Decreto 0159/2026). Cálculo orientativo, consulta tu contador. ·{' '}
          <strong>Químico:</strong> Fórmulas estándar de química analítica. ·{' '}
          <strong>Formulación:</strong> Solo costo de materia prima, no incluye mano de obra, envase ni CIF.
        </p>
      </div>
    </div>
  )
}
