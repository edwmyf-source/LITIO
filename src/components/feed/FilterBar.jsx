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
      className="px-4 py-2 rounded-full text-[12px] font-semibold border transition-all flex-shrink-0"
      style={active
        ? { background: '#0047AB', color: '#ffffff', border: '1.5px solid #0047AB' }
        : { background: '#FFFFFF', color: '#3A5590', border: '1.5px solid #D6E2F5' }}
    >
      {label}
    </button>
  )
}

function Section({ title, value, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: '1px solid #D6E2F5' }}>
      {title && (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center relative px-3 py-2.5"
        >
          <span className="text-[11px] font-semibold" style={{ color: '#0047AB' }}>{title}</span>
          <span className="flex items-center gap-1.5 absolute right-3">
            {value && <span className="text-[10px] font-bold" style={{ color: '#2C6BD4' }}>{value}</span>}
            <ChevronDown size={13}
              style={{ color: '#3A5590', transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
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
      <div className="rounded-xl overflow-hidden mb-2" style={{ background: '#ffffff', border: '1.5px solid #D6E2F5' }}>

        {/* Header navy */}
        <div className="flex items-center justify-center relative px-3 py-3.5" style={{ background: '#0047AB' }}>
          <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: '#6B87B8', letterSpacing: '0.1em' }}>
            ¿Qué quieres ver hoy?
          </span>
          {hasFilters && (
            <button
              onClick={() => { setFilters({}); setOpenSec('categoria') }}
              className="absolute right-3 text-[10px] font-bold hover:opacity-80"
              style={{ color: '#2C6BD4' }}>
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
      <div className="flex gap-2 mb-2">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[12px] font-bold transition-all"
          style={{ background: '#0047AB', color: '#fff', border: '1.5px solid #0047AB' }}>
          <FileText size={14} /> Publicaciones
        </button>
        <button
          onClick={() => navigate('/contacts')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[12px] font-bold transition-all"
          style={{ background: '#fff', color: '#3A5590', border: '1.5px solid #D6E2F5' }}>
          <Users size={14} /> Personas
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6B87B8' }} />
        <input
          ref={searchRef}
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          placeholder="Busca lo que necesitas..."
          className="w-full pl-10 pr-9 py-2 rounded-full text-[13px] focus:outline-none transition-colors"
          style={{ background: '#ffffff', border: '1.5px solid #D6E2F5', color: '#0047AB' }}
          onFocus={e => e.currentTarget.style.borderColor = '#0047AB'}
          onBlur={e => e.currentTarget.style.borderColor = '#D6E2F5'}
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
