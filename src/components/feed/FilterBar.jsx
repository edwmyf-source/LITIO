import { Search, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  MARKETPLACE_TABS,
  TIENDA_CATS,
  NOVEDADES_SUBCATS,
  VACANTES_NIVELES,
  TAB_COLOR,
} from '../../lib/constants'

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-[11px] font-semibold border transition-all flex-shrink-0"
      style={active
        ? { background: '#001A3D', color: '#FFB703', border: '1.5px solid #001A3D' }
        : { background: '#F2F7FF', color: '#5D8BC7', border: '1.5px solid #CDDBEC' }}
    >
      {label}
    </button>
  )
}

function Section({ title, value, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: '1px solid #DDE7F4' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <span className="text-[11px] font-semibold" style={{ color: '#001A3D' }}>{title}</span>
        <span className="flex items-center gap-1.5">
          {value && <span className="text-[10px] font-bold" style={{ color: '#FFB703' }}>{value}</span>}
          <ChevronDown size={13}
            style={{ color: '#5D8BC7', transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </span>
      </button>
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FilterBar({ filters, setFilters }) {
  const [openSec, setOpenSec] = useState('categoria') // categoria | subcategoria | ordenar | null

  const set    = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const tab    = filters.tab || 'todo'
  const hasFilters = tab !== 'todo' || filters.subcategory || filters.search || filters.category

  const setTab = (t) => {
    const tabDef = MARKETPLACE_TABS.find(x => x.value === t)
    setFilters({ tab: t, categories: tabDef?.categories || [], subcategory: '', category: '' })
  }
  const setCat = (v) => setFilters(f => ({ ...f, category: f.category === v ? '' : v, subcategory: '' }))
  const setSub = (v) => set('subcategory', filters.subcategory === v ? '' : v)
  const toggle = (s) => setOpenSec(o => o === s ? null : s)

  const tiendaCat = TIENDA_CATS.find(c => c.value === filters.category)
  const tabLabel  = MARKETPLACE_TABS.find(t => t.value === tab)?.label || 'TODO'

  // Subcategorías según tab
  const subOptions = tab === 'tienda'
    ? (tiendaCat ? tiendaCat.subcategories : [])
    : tab === 'novedades' ? NOVEDADES_SUBCATS
    : tab === 'vacantes'  ? VACANTES_NIVELES
    : []

  return (
    <div className="mb-2 px-2">

      {/* Buscador */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#7EB6FF' }} />
        <input
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          placeholder="Buscar en el feed..."
          className="w-full pl-10 pr-9 py-2 rounded-full text-[13px] focus:outline-none transition-colors"
          style={{ background: '#ffffff', border: '1.5px solid #CDDBEC', color: '#001A3D' }}
          onFocus={e => e.currentTarget.style.borderColor = '#001A3D'}
          onBlur={e => e.currentTarget.style.borderColor = '#CDDBEC'}
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={13} style={{ color: '#001A3D' }} />
          </button>
        )}
      </div>

      {/* Accordion D2 */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1.5px solid #CDDBEC' }}>

        {/* Header navy */}
        <div className="flex items-center justify-between px-3 py-2" style={{ background: '#001A3D' }}>
          <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: '#7EB6FF', letterSpacing: '0.15em' }}>
            ⚙ FILTROS
          </span>
          {hasFilters && (
            <button
              onClick={() => { setFilters({}); setOpenSec('categoria') }}
              className="text-[10px] font-bold hover:opacity-80"
              style={{ color: '#FFB703' }}>
              Limpiar
            </button>
          )}
        </div>

        {/* Sección: Categoría */}
        <Section
          title="Categoría"
          value={tab !== 'todo' ? tabLabel : null}
          open={openSec === 'categoria'}
          onToggle={() => toggle('categoria')}
        >
          {MARKETPLACE_TABS.map(t => (
            <Pill key={t.value} label={t.label}
              active={tab === t.value}
              onClick={() => { setTab(t.value); setOpenSec(t.value !== 'todo' ? 'subcategoria' : null) }} />
          ))}
        </Section>

        {/* Sección: Subcategoría (solo si el tab tiene sub-opciones) */}
        {tab === 'tienda' && (
          <Section
            title="Subcategoría"
            value={filters.category ? TIENDA_CATS.find(c=>c.value===filters.category)?.label : null}
            open={openSec === 'subcategoria'}
            onToggle={() => toggle('subcategoria')}
          >
            {TIENDA_CATS.map(c => (
              <Pill key={c.value} label={c.label}
                active={filters.category === c.value}
                onClick={() => { setCat(c.value); setOpenSec('subcategoria') }} />
            ))}
            {tiendaCat && tiendaCat.subcategories.map(sub => (
              <Pill key={sub} label={sub}
                active={filters.subcategory === sub}
                onClick={() => setSub(sub)} />
            ))}
          </Section>
        )}

        {subOptions.length > 0 && tab !== 'tienda' && (
          <Section
            title="Subcategoría"
            value={filters.subcategory || null}
            open={openSec === 'subcategoria'}
            onToggle={() => toggle('subcategoria')}
          >
            {subOptions.map(sub => (
              <Pill key={sub} label={sub}
                active={filters.subcategory === sub}
                onClick={() => { setSub(sub); setOpenSec(null) }} />
            ))}
          </Section>
        )}

      </div>
    </div>
  )
}
