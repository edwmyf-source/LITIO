import { useState, useEffect } from 'react'
import { Calculator, Info, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

// ─── Constantes 2026 ──────────────────────────────────────────────────────────
const SMMLV_DEFAULT = 1_750_905
const ARL_PCTS = { 1: 0.00522, 2: 0.01044, 3: 0.02436, 4: 0.04350, 5: 0.06960 }
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cop0 = v => '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const cop  = v => '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const num  = s => Number(String(s).replace(/[^0-9]/g, '')) || 0
const numF = s => parseFloat(String(s).replace(/,/g, '.')) || 0
const fmt  = (v, d = 4) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: d })
const fmtM = v => { const n = num(v); return n ? cop0(n) : '' }

// ─── Seguridad social ─────────────────────────────────────────────────────────
function fspPct(ibc, sm) {
  const r = sm > 0 ? ibc / sm : 0
  if (r < 4) return 0; if (r < 7) return 0.015; if (r < 11) return 0.018
  if (r < 19) return 0.025; if (r <= 20) return 0.028; return 0.03
}
function calcServ(h, arlPct, sm) {
  const ibc = Math.max(h * 0.4, sm)
  const sa = ibc * 0.125, pe = ibc * 0.125, ar = ibc * arlPct, fs = ibc * fspPct(ibc, sm)
  return { ing: h, ibc, salud: -sa, pension: -pe, arl: -ar, fsp: -fs, total: h - (sa + pe + ar + fs) }
}
function calcLab(s, sm) {
  const ibc = Math.max(s, sm), fs = ibc * fspPct(ibc, sm)
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
// LABORAL — Tab Mensual
// ═══════════════════════════════════════════════════════════════════════════════
function FilaComparativa({ label, s, l, hi }) {
  const fmtCelda = (v) => {
    if (v === 0 || v === undefined) return { txt: '0', color: '#2A2A2A' }
    const signo = v > 0 ? '+ ' : '− '
    return { txt: signo + cop0(Math.abs(v)), color: v > 0 ? '#1b5e20' : '#c62828' }
  }
  const cS = fmtCelda(s), cL = fmtCelda(l)
  return (
    <div className="grid gap-1 px-3 py-1.5" style={{ gridTemplateColumns: '1.3fr 1fr 1fr', ...(hi ? { background: '#F3F3F3', borderTop: '1px solid #D9D9D9' } : { borderTop: '1px solid #eef2ff' }) }}>
      <span className={hi ? 'text-xs font-bold' : 'text-xs'} style={{ color: '#111111' }}>{label}</span>
      <span className={hi ? 'text-xs font-black text-right tabular-nums' : 'text-xs text-right tabular-nums'} style={{ color: hi ? '#B01F1F' : cS.color }}>{hi ? cop0(s) : cS.txt}</span>
      <span className={hi ? 'text-xs font-black text-right tabular-nums' : 'text-xs text-right tabular-nums'} style={{ color: hi ? '#6d28d9' : cL.color }}>{hi ? cop0(l) : cL.txt}</span>
    </div>
  )
}

function TabMensual() {
  const [tipo, setTipo] = useState('servicios')
  const [ingreso, setIngreso] = useState('')
  const [arl, setArl] = useState('1')
  const [sm] = useState(SMMLV_DEFAULT)
  const [res, setRes] = useState(null)

  function calcular() {
    const v = num(ingreso)
    if (!v) return
    const arlPct = ARL_PCTS[arl]
    if (tipo === 'servicios') {
      const s = calcServ(v, arlPct, sm), eq = buscar(s.total, 'lab', arlPct, sm), l = calcLab(eq, sm)
      setRes({ tipo, s, l, eq, neto: s.total })
    } else {
      const l = calcLab(v, sm), eq = buscar(l.total, 's', arlPct, sm), s = calcServ(eq, arlPct, sm)
      setRes({ tipo, s, l, eq, neto: l.total })
    }
  }

  const actual = res ? (res.tipo === 'servicios' ? res.s : res.l) : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Tipo de contrato</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="servicios">Prestación servicios</option>
            <option value="laboral">Contrato laboral</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>{tipo === 'servicios' ? 'Honorario' : 'Salario'} mensual</label>
          <input value={ingreso} onChange={e => setIngreso(fmtM(e.target.value))} placeholder="$0" inputMode="numeric"
            className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Clase de riesgo ARL</label>
          <select value={arl} onChange={e => setArl(e.target.value)} className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="1">I — 0.522% (oficina, admin)</option>
            <option value="2">II — 1.044% (lab, comercio)</option>
            <option value="3">III — 2.436% (química, técnico)</option>
            <option value="4">IV — 4.350% (minería, petróleo)</option>
            <option value="5">V — 6.960% (alta peligrosidad)</option>
          </select>
        </div>
      </div>
      <button onClick={calcular} className="w-full text-white font-bold py-2 rounded-xl transition text-sm" style={{ background: '#D62828' }}>Calcular equivalencia</button>
      {res && (
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-100 overflow-hidden">
            <div className="grid gap-1 px-3 py-2" style={{ gridTemplateColumns: '1.3fr 1fr 1fr', background: '#F3F3F3' }}>
              <span className="text-[10px] font-bold" style={{ color: '#8A8A8A' }}>Concepto</span>
              <span className="text-[10px] font-bold text-right" style={{ color: '#B01F1F' }}>Honorario</span>
              <span className="text-[10px] font-bold text-right" style={{ color: '#6d28d9' }}>Salario</span>
            </div>
            <FilaComparativa label="Ingreso bruto" s={res.s.ing} l={res.l.ing} />
            <FilaComparativa label="Salud" s={res.s.salud} l={res.l.salud} />
            <FilaComparativa label="Pensión" s={res.s.pension} l={res.l.pension} />
            <FilaComparativa label="Fondo solidaridad" s={res.s.fsp} l={res.l.fsp || 0} />
            <FilaComparativa label="ARL" s={res.s.arl} l={0} />
            <FilaComparativa label="Prima" s={0} l={res.l.prima || 0} />
            <FilaComparativa label="Cesantías" s={0} l={res.l.cesantias || 0} />
            <FilaComparativa label="Int. cesantías" s={0} l={res.l.intCes || 0} />
            <FilaComparativa label="Vacaciones" s={0} l={res.l.vacaciones || 0} />
            <FilaComparativa label="Neto mensual" s={res.s.total} l={res.l.total} hi />
          </div>

          <div className="rounded-2xl p-4" style={{ background: '#F3F3F3', border: '1px solid #D9D9D9' }}>
            <p className="text-xs" style={{ color: '#111111', lineHeight: 1.5 }}>
              {res.tipo === 'servicios'
                ? <>Tus honorarios de <strong>{cop0(actual.ing)}</strong> equivalen aproximadamente a un contrato laboral por</>
                : <>Tu salario de <strong>{cop0(actual.ing)}</strong> equivale aproximadamente a unos honorarios por</>}
              {' '}al mes
            </p>
            <p className="text-2xl font-black mt-1" style={{ color: '#B01F1F' }}>{cop0(res.eq)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TabAnual() {
  const [arl, setArl] = useState('1')
  const [ingresos, setIngresos] = useState(Array(12).fill(''))
  const [res, setRes] = useState(null)

  function calcular() {
    const arlPct = ARL_PCTS[arl]
    const vals = ingresos.map(v => num(v))
    if (vals.every(v => v <= 0)) return alert('Ingresa al menos un mes')
    const netosPS = vals.map(v => v > 0 ? calcServ(v, arlPct, SMMLV_DEFAULT).total : 0)
    const total = netosPS.reduce((a, b) => a + b, 0)
    const activos = vals.filter(v => v > 0).length
    const salEq = buscar(total / 12, 'lab', arlPct, SMMLV_DEFAULT)
    setRes({ netosPS, total, promedio: total / 12, activos, salEq })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3" style={{ background: '#F3F3F3', border: '1px solid #D9D9D9' }}>
        <p className="text-xs" style={{ color: '#111111', lineHeight: 1.5 }}>
          Ingresa tus honorarios mensuales del año para calcular a cuánto equivaldría un contrato laboral anual con el mismo neto.
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Clase de riesgo ARL</label>
        <select value={arl} onChange={e => setArl(e.target.value)} className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="1">I — 0.522%</option><option value="2">II — 1.044%</option><option value="3">III — 2.436%</option><option value="4">IV — 4.350%</option><option value="5">V — 6.960%</option>
        </select>
      </div>
      <div className="rounded-xl border border-blue-100 overflow-hidden">
        <table className="w-full">
          <thead style={{ background: '#F3F3F3' }}><tr><th className="py-1.5 px-3 text-left text-xs font-bold" style={{ color: '#8A8A8A' }}>Mes</th><th className="py-1.5 px-3 text-right text-xs font-bold" style={{ color: '#0369a1' }}>Honorario</th></tr></thead>
          <tbody>
            {MESES.map((m, i) => (
              <tr key={m} className="border-t border-blue-50">
                <td className="py-1 px-3 text-xs" style={{ color: '#111111' }}>{m}</td>
                <td className="py-1 px-2"><input value={ingresos[i]} onChange={e => { const a = [...ingresos]; a[i] = fmtM(e.target.value); setIngresos(a) }} placeholder="$0" inputMode="numeric" className="w-full text-right border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={calcular} className="w-full text-white font-bold py-2 rounded-xl transition text-sm" style={{ background: '#D62828' }}>Calcular</button>
      {res && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[['Neto anual', cop0(res.total), '#F3F3F3', '#B01F1F'], ['Promedio mensual', cop0(res.promedio), '#F3F3F3', '#B01F1F'], ['Equivale a salario', cop0(res.salEq), '#f5f3ff', '#6d28d9']].map(([l, v, bg, c]) => (
              <div key={l} className="rounded-xl p-2.5 text-center border border-blue-100" style={{ background: bg }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: c, opacity: 0.7 }}>{l}</p>
                <p className="text-base font-black" style={{ color: c }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#F3F3F3', border: '1px solid #D9D9D9' }}>
            <p className="text-xs" style={{ color: '#111111', lineHeight: 1.5 }}>
              Tus honorarios anuales equivalen aproximadamente a un contrato laboral por
            </p>
            <p className="text-2xl font-black mt-1" style={{ color: '#B01F1F' }}>{cop0(res.salEq)} al mes</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUÍMICO
// ═══════════════════════════════════════════════════════════════════════════════
function CalcDiluciones() {
  const [inc, setInc] = useState('v1')
  const [c1, setC1] = useState(''), [v1, setV1] = useState(''), [c2, setC2] = useState(''), [v2, setV2] = useState('')
  const [res, setRes] = useState(null)

  function calcular() {
    const vals = { c1: numF(c1), v1: numF(v1), c2: numF(c2), v2: numF(v2) }
    let r
    if (inc === 'v1') r = (vals.c2 * vals.v2) / vals.c1
    else if (inc === 'c1') r = (vals.c2 * vals.v2) / vals.v1
    else if (inc === 'c2') r = (vals.c1 * vals.v1) / vals.v2
    else r = (vals.c1 * vals.v1) / vals.c2
    if (!isFinite(r) || r <= 0) return alert('Verifica los valores')
    setRes({ valor: r, inc })
  }

  const labels = { c1: 'C₁ concentración inicial (%)', v1: 'V₁ volumen inicial (mL)', c2: 'C₂ concentración final (%)', v2: 'V₂ volumen final (mL)' }
  const resLabel = { v1: 'Volumen a tomar (V₁)', c1: 'Concentración madre (C₁)', c2: 'Concentración final (C₂)', v2: 'Volumen final (V₂)' }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>¿Qué quiero calcular?</label>
        <select value={inc} onChange={e => { setInc(e.target.value); setRes(null) }} className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="v1">V₁ — volumen a tomar de la solución madre</option>
          <option value="c1">C₁ — concentración de la solución madre</option>
          <option value="c2">C₂ — concentración final deseada</option>
          <option value="v2">V₂ — volumen final de la dilución</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['c1','v1','c2','v2'].map(k => (
          <div key={k} className={inc === k ? 'opacity-40 pointer-events-none' : ''}>
            <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>{labels[k]}</label>
            <input value={{ c1, v1, c2, v2 }[k]} onChange={e => ({ c1: setC1, v1: setV1, c2: setC2, v2: setV2 }[k])(e.target.value)}
              disabled={inc === k} placeholder={inc === k ? '?' : '0'} inputMode="decimal"
              className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-blue-50" />
          </div>
        ))}
      </div>
      <button onClick={calcular} className="w-full text-white font-bold py-2 rounded-xl text-sm" style={{ background: '#D62828' }}>Calcular (C₁V₁ = C₂V₂)</button>
      {res && (
        <div className="rounded-2xl p-3 text-center" style={{ background: '#F3F3F3', border: '1px solid #D9D9D9' }}>
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#D62828' }}>{resLabel[res.inc]}</p>
          <p className="text-3xl font-black" style={{ color: '#B01F1F' }}>{fmt(res.valor)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#C4C4C4' }}>{res.inc.startsWith('v') ? 'mL' : '%'}</p>
        </div>
      )}
    </div>
  )
}

// Conversión en tiempo real — sin botón
function CalcConversion() {
  const [valor, setValor] = useState('')
  const [desde, setDesde] = useState('porcPV')
  const [densidad, setDensidad] = useState('1')
  const [pm, setPm] = useState('')
  const [res, setRes] = useState(null)

  useEffect(() => {
    const v = numF(valor), d = numF(densidad) || 1, pmV = numF(pm)
    if (!v) { setRes(null); return }
    let gL
    if (desde === 'porcPV') gL = v * 10
    else if (desde === 'porcVV') gL = v * d * 10
    else if (desde === 'ppmMV') gL = v / 1000
    else if (desde === 'mgmL') gL = v
    else if (desde === 'gL') gL = v
    else if (desde === 'molL') { if (!pmV) { setRes(null); return }; gL = v * pmV }
    const r = {
      'g/L': fmt(gL), 'mg/mL': fmt(gL), '% p/v': fmt(gL / 10),
      'ppm (mg/L)': fmt(gL * 1000), 'µg/mL': fmt(gL * 1000),
    }
    if (pmV) r['mol/L (M)'] = fmt(gL / pmV)
    setRes(r)
  }, [valor, desde, densidad, pm])

  const unidades = [
    { id: 'porcPV', label: '% p/v' }, { id: 'porcVV', label: '% v/v' },
    { id: 'ppmMV', label: 'ppm (mg/L)' }, { id: 'mgmL', label: 'mg/mL' },
    { id: 'gL', label: 'g/L' }, { id: 'molL', label: 'mol/L (M)' },
  ]

  return (
    <div className="space-y-3">
      {/* Fila principal: valor + unidad */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Valor a convertir</label>
          <input value={valor} onChange={e => setValor(e.target.value)} placeholder="0" inputMode="decimal"
            className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Unidad de entrada</label>
          <select value={desde} onChange={e => setDesde(e.target.value)} className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
            {unidades.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </div>
      {/* Opcionales */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#8A8A8A' }}>Densidad (g/mL) <span className="font-normal">— % v/v</span></label>
          <input value={densidad} onChange={e => setDensidad(e.target.value)} placeholder="1.00" inputMode="decimal"
            className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#8A8A8A' }}>PM (g/mol) <span className="font-normal">— molar</span></label>
          <input value={pm} onChange={e => setPm(e.target.value)} placeholder="opcional" inputMode="decimal"
            className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </div>
      {/* Resultado en tiempo real */}
      <div className="rounded-2xl border border-blue-100 overflow-hidden" style={{ background: '#fff' }}>
        <div className="px-3 py-2" style={{ background: '#F3F3F3', borderBottom: '1px solid #D9D9D9' }}>
          <p className="text-xs font-bold" style={{ color: '#D62828' }}>Equivalencias</p>
        </div>
        {res ? Object.entries(res).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center px-3 py-2 border-t border-blue-50 first:border-0">
            <span className="text-xs" style={{ color: '#8A8A8A' }}>{k}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#B01F1F' }}>{v}</span>
          </div>
        )) : (
          <div className="px-3 py-4 text-center text-xs" style={{ color: '#C4C4C4' }}>Ingresa un valor para ver las equivalencias</div>
        )}
      </div>
    </div>
  )
}

function CalcPureza() {
  const [masa, setMasa] = useState(''), [pureza, setPureza] = useState(''), [res, setRes] = useState(null)

  useEffect(() => {
    const m = numF(masa), p = numF(pureza)
    if (!m || !p || p > 100) { setRes(null); return }
    setRes({ m, principioActivo: m * (p / 100), excipiente: m * (1 - p / 100) })
  }, [masa, pureza])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Masa del reactivo (g)</label>
          <input value={masa} onChange={e => setMasa(e.target.value)} placeholder="100" inputMode="decimal"
            className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Pureza del certificado (%)</label>
          <input value={pureza} onChange={e => setPureza(e.target.value)} placeholder="99.5" inputMode="decimal"
            className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Masa total', res ? fmt(res.m) : '—', '#F3F3F3', '#D62828'],
          ['Principio activo', res ? fmt(res.principioActivo) : '—', '#f0fdf4', '#15803d'],
          ['Impurezas', res ? fmt(res.excipiente) : '—', '#f9fafb', '#6b7280'],
        ].map(([l, v, bg, c]) => (
          <div key={l} className="rounded-xl p-2.5 text-center border border-blue-50" style={{ background: bg }}>
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: c, opacity: 0.8 }}>{l}</p>
            <p className="text-base font-black" style={{ color: c }}>{v}</p>
            <p className="text-[9px]" style={{ color: c, opacity: 0.6 }}>g</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalcPH() {
  const [tipo, setTipo] = useState('debil')
  const [conc, setConc] = useState(''), [pKa, setPKa] = useState(''), [cAcido, setCAcido] = useState(''), [cBase, setCBase] = useState('')
  const [res, setRes] = useState(null)

  function calcular() {
    if (tipo === 'buffer') {
      const pka = numF(pKa), ca = numF(cAcido), cb = numF(cBase)
      if (!pka || !ca || !cb) return alert('Completa todos los campos')
      const pH = pka + Math.log10(cb / ca)
      setRes(fmt(pH, 2))
    } else {
      const c = numF(conc)
      if (!c) return alert('Ingresa la concentración')
      let pH
      if (tipo === 'fuerte_acido') pH = -Math.log10(c)
      else if (tipo === 'fuerte_base') pH = 14 + Math.log10(c)
      else { const ka = Math.pow(10, -numF(pKa)); const h = (-ka + Math.sqrt(ka * ka + 4 * ka * c)) / 2; pH = -Math.log10(h) }
      setRes(fmt(pH, 2))
    }
  }

  const pHNum = numF(res)
  const pHColor = pHNum < 4 ? '#dc2626' : pHNum < 6.5 ? '#ea580c' : pHNum < 7.5 ? '#16a34a' : pHNum < 10 ? '#D62828' : '#7c3aed'

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Tipo de cálculo</label>
        <select value={tipo} onChange={e => { setTipo(e.target.value); setRes(null) }} className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="fuerte_acido">Ácido fuerte — pH = -log[H⁺]</option>
          <option value="fuerte_base">Base fuerte — pH = 14 + log[OH⁻]</option>
          <option value="debil">Ácido débil — equilibrio Ka</option>
          <option value="buffer">Buffer — Henderson-Hasselbalch</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(tipo !== 'buffer') && (
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>Concentración (mol/L)</label>
            <input value={conc} onChange={e => setConc(e.target.value)} placeholder="0.1" inputMode="decimal" className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        )}
        {(tipo === 'debil' || tipo === 'buffer') && (
          <div className={tipo === 'buffer' ? '' : 'col-span-2'}>
            <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>pKa del ácido</label>
            <input value={pKa} onChange={e => setPKa(e.target.value)} placeholder="4.76" inputMode="decimal" className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        )}
        {tipo === 'buffer' && (<>
          <div>
            <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>[Ácido] (mol/L)</label>
            <input value={cAcido} onChange={e => setCAcido(e.target.value)} placeholder="0.1" inputMode="decimal" className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-0.5" style={{ color: '#111111' }}>[Base conj.] (mol/L)</label>
            <input value={cBase} onChange={e => setCBase(e.target.value)} placeholder="0.1" inputMode="decimal" className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </>)}
      </div>
      <button onClick={calcular} className="w-full text-white font-bold py-2 rounded-xl text-sm" style={{ background: '#D62828' }}>Calcular pH</button>
      {res && (
        <div className="rounded-2xl p-4 text-center border" style={{ background: '#fff', borderColor: pHColor + '40' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: pHColor }}>pH calculado</p>
          <p className="text-5xl font-black" style={{ color: pHColor }}>{res}</p>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #dc2626, #ea580c, #eab308, #16a34a, #D62828, #7c3aed)' }}>
            <div className="h-full w-1 rounded-full bg-white shadow-md" style={{ marginLeft: `${Math.min(Math.max((pHNum / 14) * 100, 0), 98)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] mt-0.5" style={{ color: '#9ca3af' }}>
            <span>0 ácido</span><span>7 neutro</span><span>14 básico</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMULACIÓN — SIMPLIFICADA
// ═══════════════════════════════════════════════════════════════════════════════
const ID_SEQ = { v: 1 }
const newId = () => ID_SEQ.v++

const PRESENTACIONES_DEFAULT = [
  { id: newId(), label: '60 g',   g: 60 },
  { id: newId(), label: '100 g',  g: 100 },
  { id: newId(), label: '250 g',  g: 250 },
  { id: newId(), label: '500 g',  g: 500 },
  { id: newId(), label: '1 kg',   g: 1000 },
]

function FormulacionSimple() {
  // Ingredientes
  const [ings, setIngs] = useState([
    { id: newId(), nombre: '', costoKg: '', pct: '' },
    { id: newId(), nombre: '', costoKg: '', pct: '' },
  ])
  // Presentaciones
  const [pres, setPres] = useState(PRESENTACIONES_DEFAULT)
  const [margen, setMargen] = useState('')
  const [res, setRes] = useState(null)

  const addIng = () => setIngs(p => [...p, { id: newId(), nombre: '', costoKg: '', pct: '' }])
  const delIng = id => setIngs(p => p.filter(i => i.id !== id))
  const updIng = (id, f, v) => setIngs(p => p.map(i => i.id === id ? { ...i, [f]: v } : i))
  const addPres = () => setPres(p => [...p, { id: newId(), label: '', g: '' }])
  const delPres = id => setPres(p => p.filter(i => i.id !== id))
  const updPres = (id, f, v) => setPres(p => p.map(i => i.id === id ? { ...i, [f]: v } : i))

  function calcular() {
    const filas = ings.map(i => {
      const cpg = numF(i.costoKg) / 1000
      const pct = numF(i.pct) / 100
      return { ...i, cpg, pct, aporte: cpg * pct * 1000 }
    })
    const totalPct = filas.reduce((a, f) => a + f.pct * 100, 0)
    const costoPorGramo = filas.reduce((a, f) => a + f.cpg * f.pct, 0)
    const mg = numF(margen) / 100
    const presFinal = pres.filter(p => numF(p.g) > 0).map(p => {
      const g = numF(p.g)
      const costoMP = costoPorGramo * g
      return { ...p, costoMP, precioVenta: mg > 0 ? costoMP / (1 - mg) : null }
    })
    setRes({ filas, totalPct, costoPorGramo, costoPorKg: costoPorGramo * 1000, pres: presFinal, mg })
  }

  return (
    <div className="space-y-4">
      {/* Ingredientes */}
      <div>
        <p className="text-xs font-bold mb-1.5" style={{ color: '#111111' }}>Ingredientes</p>
        <div className="rounded-xl overflow-hidden border border-blue-100">
          <div className="grid grid-cols-12 gap-1 px-2 py-1.5 text-[10px] font-bold" style={{ background: '#F3F3F3', color: '#8A8A8A' }}>
            <span className="col-span-4">Ingrediente</span>
            <span className="col-span-3 text-right">$/kg</span>
            <span className="col-span-3 text-right">% p/p</span>
            <span className="col-span-2"></span>
          </div>
          {ings.map((ing, idx) => (
            <div key={ing.id} className="grid grid-cols-12 gap-1 px-2 py-1.5 border-t border-blue-50 items-center">
              <input value={ing.nombre} onChange={e => updIng(ing.id, 'nombre', e.target.value)} placeholder={`Ing. ${idx + 1}`}
                className="col-span-4 border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <input value={ing.costoKg} onChange={e => updIng(ing.id, 'costoKg', e.target.value)} placeholder="0" inputMode="decimal"
                className="col-span-3 border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <input value={ing.pct} onChange={e => updIng(ing.id, 'pct', e.target.value)} placeholder="0" inputMode="decimal"
                className="col-span-3 border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <button onClick={() => delIng(ing.id)} className="col-span-2 flex justify-center" style={{ color: '#fca5a5' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <button onClick={addIng} className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold border-2 border-dashed border-blue-200 transition-colors hover:bg-blue-50" style={{ color: '#D62828' }}>
          <Plus size={13} /> Agregar ingrediente
        </button>
      </div>

      {/* Presentaciones + margen */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold" style={{ color: '#111111' }}>Presentaciones</p>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px]" style={{ color: '#8A8A8A' }}>Margen %</label>
            <input value={margen} onChange={e => setMargen(e.target.value)} placeholder="30" inputMode="decimal"
              className="w-14 border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-300" />
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-blue-100">
          <div className="grid grid-cols-10 gap-1 px-2 py-1.5 text-[10px] font-bold" style={{ background: '#F3F3F3', color: '#8A8A8A' }}>
            <span className="col-span-4">Presentación</span>
            <span className="col-span-4 text-right">Gramos</span>
            <span className="col-span-2"></span>
          </div>
          {pres.map(p => (
            <div key={p.id} className="grid grid-cols-10 gap-1 px-2 py-1.5 border-t border-blue-50 items-center">
              <input value={p.label} onChange={e => updPres(p.id, 'label', e.target.value)} placeholder="60 g"
                className="col-span-4 border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <input value={p.g} onChange={e => updPres(p.id, 'g', e.target.value)} placeholder="60" inputMode="decimal"
                className="col-span-4 border border-blue-100 rounded-lg px-2 py-1 text-xs bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-300" />
              <button onClick={() => delPres(p.id)} className="col-span-2 flex justify-center" style={{ color: '#fca5a5' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <button onClick={addPres} className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold border-2 border-dashed border-blue-200 hover:bg-blue-50" style={{ color: '#D62828' }}>
          <Plus size={13} /> Agregar presentación
        </button>
      </div>

      <button onClick={calcular} className="w-full text-white font-bold py-2 rounded-xl text-sm" style={{ background: '#D62828' }}>Calcular costos</button>

      {res && (
        <div className="space-y-3">
          {/* Resumen costo */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5 text-center border border-blue-100" style={{ background: '#F3F3F3' }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#D62828', opacity: 0.7 }}>Costo por gramo</p>
              <p className="text-base font-black" style={{ color: '#B01F1F' }}>{cop(res.costoPorGramo)}</p>
            </div>
            <div className="rounded-xl p-2.5 text-center border border-blue-100" style={{ background: '#F3F3F3' }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#D62828', opacity: 0.7 }}>Costo por kg</p>
              <p className="text-base font-black" style={{ color: '#B01F1F' }}>{cop(res.costoPorKg)}</p>
            </div>
          </div>

          {Math.abs(res.totalPct - 100) > 0.5 && (
            <div className="rounded-xl p-2.5 flex gap-2 items-start" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
              <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <p className="text-xs" style={{ color: '#92400e' }}>Los porcentajes suman <strong>{fmt(res.totalPct, 1)}%</strong>. Una fórmula completa debe sumar 100%.</p>
            </div>
          )}

          {/* Tabla ingredientes */}
          <div className="rounded-xl overflow-hidden border border-blue-100">
            <div className="grid grid-cols-12 px-2 py-1.5 text-[10px] font-bold" style={{ background: '#F3F3F3', color: '#8A8A8A' }}>
              <span className="col-span-4">Ingrediente</span>
              <span className="col-span-3 text-right">% p/p</span>
              <span className="col-span-5 text-right">Aporte $/kg PT</span>
            </div>
            {res.filas.map((f, i) => (
              <div key={i} className="grid grid-cols-12 px-2 py-1.5 border-t border-blue-50">
                <span className="col-span-4 text-xs" style={{ color: '#111111' }}>{f.nombre || `Ing. ${i + 1}`}</span>
                <span className="col-span-3 text-right text-xs tabular-nums" style={{ color: '#8A8A8A' }}>{fmt(f.pct * 100, 1)}%</span>
                <span className="col-span-5 text-right text-xs font-semibold tabular-nums" style={{ color: '#B01F1F' }}>{cop(f.aporte)}</span>
              </div>
            ))}
          </div>

          {/* Tabla presentaciones */}
          <div className="rounded-xl overflow-hidden border border-blue-100">
            <div className="grid grid-cols-12 px-2 py-1.5 text-[10px] font-bold" style={{ background: '#F3F3F3', color: '#8A8A8A' }}>
              <span className="col-span-3">Pres.</span>
              <span className="col-span-2 text-right">g</span>
              <span className="col-span-4 text-right">Costo MP</span>
              {res.mg > 0 && <span className="col-span-3 text-right">Precio</span>}
            </div>
            {res.pres.map((p, i) => (
              <div key={i} className="grid grid-cols-12 px-2 py-1.5 border-t border-blue-50">
                <span className="col-span-3 text-xs font-semibold" style={{ color: '#111111' }}>{p.label || `${p.g}g`}</span>
                <span className="col-span-2 text-right text-xs tabular-nums" style={{ color: '#8A8A8A' }}>{fmt(numF(p.g), 0)}</span>
                <span className="col-span-4 text-right text-xs font-bold tabular-nums" style={{ color: '#B01F1F' }}>{cop(p.costoMP)}</span>
                {res.mg > 0 && <span className="col-span-3 text-right text-xs font-bold tabular-nums" style={{ color: '#15803d' }}>{cop(p.precioVenta)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════════
function FAQ({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-blue-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2.5 text-left text-xs font-semibold hover:bg-blue-50 transition" style={{ color: '#111111' }}>
        {pregunta}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <p className="px-3 pb-3 text-xs leading-relaxed" style={{ color: '#8A8A8A' }}>{respuesta}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const TABS_LAB = [{ id: 'mensual', label: 'Mensual' }, { id: 'anual', label: 'Anual' }]

export default function HerramientasPage() {
  const [tabLab, setTabLab] = useState('mensual')

  const titulo = { mensual: 'Comparación mensual', anual: 'Comparación anual' }

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator size={20} style={{ color: '#D62828' }} />
        <h1 className="text-lg font-black" style={{ color: '#111111' }}>Honorarios vs salario</h1>
      </div>

      {/* Card calculadora */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #D9D9D9' }}>

        {/* Sub-tabs */}
        <div className="flex p-2 gap-1.5" style={{ background: '#F3F3F3', borderBottom: '0.5px solid #D9D9D9' }}>
          {TABS_LAB.map(t => (
            <button key={t.id} onClick={() => setTabLab(t.id)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition"
              style={tabLab === t.id
                ? { background: '#D62828', color: '#fff' }
                : { background: 'transparent', color: '#C4C4C4' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Título */}
        <div className="px-3 pt-3 pb-1">
          <h2 className="font-bold text-sm" style={{ color: '#111111' }}>{titulo[tabLab]}</h2>
        </div>

        {/* Contenido */}
        <div className="p-3">
          {tabLab === 'mensual' && <TabMensual />}
          {tabLab === 'anual'   && <TabAnual />}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl p-3 flex gap-2" style={{ background: 'rgba(239,246,255,0.8)', border: '0.5px solid #D9D9D9' }}>
        <Info size={13} style={{ color: '#D62828', flexShrink: 0, marginTop: 1 }} />
        <p className="text-[11px] leading-relaxed" style={{ color: '#8A8A8A' }}>
          <strong style={{ color: '#111111' }}>Laboral:</strong> SMMLV 2026 $1.750.905 (Decreto 0159).
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-1.5">
        <FAQ pregunta="¿Qué es el IBC en prestación de servicios?" respuesta="El 40% del honorario mensual. No puede ser inferior a 1 SMMLV. Sobre ese valor se liquidan salud (12.5%), pensión (12.5%), ARL y Fondo de Solidaridad." />
        <FAQ pregunta="¿Por qué el contratista recibe menos que un empleado con igual valor?" respuesta="El contratista paga el 100% de seguridad social. El empleado paga solo el 8% (salud + pensión) y el empleador paga el resto. Sin embargo, el contratista no tiene descuentos de nómina directos." />
        <FAQ pregunta="¿La calculadora incluye retención en la fuente?" respuesta="No. La retención varía según el pagador, si eres declarante y el tipo de servicio. Consulta tu contador para el cálculo exacto." />
      </div>
    </div>
  )
}
