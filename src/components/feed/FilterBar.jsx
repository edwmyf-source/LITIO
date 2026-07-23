import { Search, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import {
  MARKETPLACE_TABS,
  TIENDA_CATS,
  NOVEDADES_SUBCATS,
  VACANTES_NIVELES,
  TAB_COLOR,
} from '../../lib/constants'

// size="lg" = categoría principal (nivel 1) · size="sm" = subfiltro (nivel 2)
function Pill({ label, active, onClick, size = 'sm' }) {
  const lg = size === 'lg'
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`transition-all flex-shrink-0 font-extrabold ${
        lg ? 'px-[18px] py-[6px] rounded-[13px] text-[13px]' : 'px-[13px] py-[4px] rounded-[10px] text-[12px]'}`}
      style={active
        ? { background: 'linear-gradient(135deg,#0B2E68,#1A5AC8)', color: '#ffffff',
            boxShadow: lg
              ? '0 6px 16px rgba(11,46,104,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 4px 12px rgba(11,46,104,0.28), inset 0 1px 0 rgba(255,255,255,0.18)' }
        : { background: '#FFFFFF', color: '#5578AD',
            boxShadow: 'inset 0 0 0 1.5px #DDE7FA' }}
    >
      {label}
    </button>
  )
}

function Section({ title, value, open, onToggle, children }) {
  return (
    <div>
      {title && (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 pt-[7px] pb-[2px]"
        >
          <span className="text-[10px] font-extrabold uppercase"
            style={{ color: '#8FA3C7', letterSpacing: '0.12em' }}>{title}</span>
          <span className="flex items-center gap-1.5">
            {value && <span className="text-[11px] font-bold" style={{ color: '#1A5AC8' }}>{value}</span>}
            <ChevronDown size={14}
              style={{ color: '#8FA3C7', transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </span>
        </button>
      )}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="px-4 pb-[7px] pt-[5px] flex flex-wrap gap-1.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FilterBar({ filters, setFilters, autoFocusSearch = false }) {
  const [openSecs, setOpenSecs] = useState(new Set(['categoria']))
  const searchRef = useRef(null)

  useEffect(() => {
    if (autoFocusSearch && searchRef.current) {
      searchRef.current.focus()
      searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [autoFocusSearch])

  const set    = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const tab    = filters.tab || 'todo'
  const hasFilters = tab !== 'todo' || filters.subcategory || filters.search || filters.category

  const setTab = (t) => {
    const tabDef = MARKETPLACE_TABS.find(x => x.value === t)
    setFilters({ tab: t, categories: tabDef?.categories || [], subcategory: '', category: '' })
  }
  const setCat = (v) => setFilters(f => ({ ...f, category: f.category === v ? '' : v, subcategory: '' }))
  const setSub = (v) => set('subcategory', filters.subcategory === v ? '' : v)
  const toggle = (s) => setOpenSecs(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })

  const tiendaCat = TIENDA_CATS.find(c => c.value === filters.category)
  const tabLabel  = MARKETPLACE_TABS.find(t => t.value === tab)?.label || 'TODO'

  // Subcategorías según tab
  const subOptions = tab === 'tienda'
    ? (tiendaCat ? tiendaCat.subcategories : [])
    : tab === 'novedades' ? NOVEDADES_SUBCATS
    : tab === 'vacantes'  ? VACANTES_NIVELES
    : []

  return (
    <div className="mb-2">

      {/* Extensión navy del header — el buscador flota sobre su borde */}
      <div className="-mx-4 md:hidden" style={{ height: 44, marginTop: -1,
        background: 'radial-gradient(circle at 30% -180%, #1A5AC8 0%, #0B2E68 50%, #081F4A 100%)' }} />

      {/* Buscador — flotando sobre el borde del navy */}
      <div className="relative z-[5] px-2" style={{ marginTop: -24 }}>
        <Search size={17} className="absolute left-[30px] top-1/2 -translate-y-1/2" style={{ color: '#8FA3C7' }} />
        <input
          ref={searchRef}
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          placeholder="Buscar en Cobalto..."
          className="w-full pl-[46px] pr-10 py-[15px] rounded-[17px] text-[14px] font-semibold focus:outline-none transition-shadow"
          style={{ background: '#ffffff', border: 'none', color: '#0A2A5C',
            boxShadow: '0 12px 32px rgba(8,31,74,0.26), inset 0 1px 0 rgba(255,255,255,0.9)' }}
          onFocus={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(8,31,74,0.26), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 3px rgba(26,90,200,0.18)'}
          onBlur={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(8,31,74,0.26), inset 0 1px 0 rgba(255,255,255,0.9)'}
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-5 top-1/2 -translate-y-1/2">
            <X size={15} style={{ color: '#0047AB' }} />
          </button>
        )}
      </div>

      {/* Accordion D2 (Filtros) */}
      <div className="rounded-[18px] overflow-hidden mb-2 mt-[9px] mx-2" style={{ background: '#ffffff', boxShadow: '0 6px 20px rgba(0,71,171,0.08)' }}>

        {hasFilters && (
          <div className="flex justify-end px-3 pt-2 pb-0.5">
            <button
              onClick={() => { setFilters({}); setOpenSec('categoria') }}
              className="text-[12px] font-bold hover:opacity-80"
              style={{ color: '#0047AB' }}>
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Sección: Categoría (sin título propio, usa el del header) */}
        <Section
          value={null}
          open={true}
          onToggle={() => {}}
        >
          {MARKETPLACE_TABS.map(t => (
            <Pill key={t.value} label={t.label} size="lg"
              active={tab === t.value}
              onClick={() => { setTab(t.value); if (t.value !== 'todo') setOpenSecs(prev => { const n = new Set(prev); n.add('subcategoria'); return n }) }} />
          ))}
        </Section>

        {/* Sección: Subcategoría (solo si el tab tiene sub-opciones) */}
        {tab === 'tienda' && (
          <Section
            title="Subcategoría"
            value={filters.category ? TIENDA_CATS.find(c=>c.value===filters.category)?.label : null}
            open={openSecs.has('subcategoria')}
            onToggle={() => toggle('subcategoria')}
          >
            {TIENDA_CATS.map(c => (
              <Pill key={c.value} label={c.label}
                active={filters.category === c.value}
                onClick={() => { setCat(c.value); setOpenSecs(prev => { const n = new Set(prev); n.add('subcategoria'); return n }) }} />
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
            open={openSecs.has('subcategoria')}
            onToggle={() => toggle('subcategoria')}
          >
            {subOptions.map(sub => (
              <Pill key={sub} label={sub}
                active={filters.subcategory === sub}
                onClick={() => setSub(sub)} />
            ))}
          </Section>
        )}

      </div>

    </div>
  )
}
