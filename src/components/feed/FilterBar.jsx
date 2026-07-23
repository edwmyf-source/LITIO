import { Search, X, ChevronDown, Users, FileText } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
      className="px-4 py-2 rounded-[12px] text-[12px] font-bold transition-all flex-shrink-0"
      style={active
        ? { background: 'linear-gradient(135deg,#0047AB,#2C6BD4)', color: '#ffffff', boxShadow: '0 4px 12px rgba(0,71,171,0.25)' }
        : { background: '#FFFFFF', color: '#5578AD', boxShadow: '0 3px 10px rgba(0,71,171,0.06)' }}
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
          className="w-full flex items-center justify-center relative px-3 py-2.5"
        >
          <span className="text-[11px] font-extrabold" style={{ color: '#0047AB' }}>{title}</span>
          <span className="flex items-center gap-1.5 absolute right-3">
            {value && <span className="text-[10px] font-bold" style={{ color: '#2C6BD4' }}>{value}</span>}
            <ChevronDown size={13}
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
          <div className="px-3 pb-3 pt-3 flex flex-wrap justify-center gap-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FilterBar({ filters, setFilters, autoFocusSearch = false }) {
  const [openSecs, setOpenSecs] = useState(new Set(['categoria']))
  const navigate = useNavigate()
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
    <div className="mb-2 px-2">

      {/* Accordion D2 (Filtros) */}
      <div className="rounded-[18px] overflow-hidden mb-2.5" style={{ background: '#ffffff', boxShadow: '0 6px 20px rgba(0,71,171,0.08)' }}>

        {/* Header con gradiente */}
        <div className="flex items-center justify-center relative px-3 py-3.5" style={{ background: 'linear-gradient(135deg,#0047AB,#2C6BD4)' }}>
          <span className="text-[11px] font-extrabold flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '0.1em' }}>
            ¿Qué quieres ver hoy?
          </span>
          {hasFilters && (
            <button
              onClick={() => { setFilters({}); setOpenSec('categoria') }}
              className="absolute right-3 text-[10px] font-bold hover:opacity-80"
              style={{ color: '#fff' }}>
              Limpiar
            </button>
          )}
        </div>

        {/* Sección: Categoría (sin título propio, usa el del header) */}
        <Section
          value={null}
          open={true}
          onToggle={() => {}}
        >
          {MARKETPLACE_TABS.map(t => (
            <Pill key={t.value} label={t.label}
              active={tab === t.value}
              onClick={() => { setTab(t.value); if (t.value !== 'todo') setOpenSecs(prev => { const n = new Set(prev); n.add('subcategoria'); return n }) }} />
          ))}
        </Section>

        {/* Sección: Subcategoría (solo si el tab tiene sub-opciones) */}
        {tab === 'tienda' && (
          <Section
            title="Cuéntanos más"
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
            title="Cuéntanos más"
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

      {/* Toggle: Publicaciones / Personas */}
      <div className="flex gap-2 mb-2.5">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[12px] font-extrabold transition-all"
          style={{ background: 'linear-gradient(135deg,#0047AB,#2C6BD4)', color: '#fff', boxShadow: '0 4px 12px rgba(0,71,171,0.25)' }}>
          <FileText size={14} /> Publicaciones
        </button>
        <button
          onClick={() => navigate('/contacts')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[12px] font-bold transition-all"
          style={{ background: '#fff', color: '#5578AD', boxShadow: '0 3px 10px rgba(0,71,171,0.06)' }}>
          <Users size={14} /> Personas
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8FA3C7' }} />
        <input
          ref={searchRef}
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          placeholder="Busca productos, servicios, personas..."
          className="w-full pl-11 pr-9 py-3 rounded-[16px] text-[13px] font-medium focus:outline-none transition-shadow"
          style={{ background: '#ffffff', border: 'none', color: '#0A2A5C', boxShadow: '0 6px 20px rgba(0,71,171,0.08)' }}
          onFocus={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,71,171,0.08), 0 0 0 3px rgba(0,71,171,0.15)'}
          onBlur={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,71,171,0.08)'}
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={13} style={{ color: '#0047AB' }} />
          </button>
        )}
      </div>
    </div>
  )
}
