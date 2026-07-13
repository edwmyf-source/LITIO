import { Search, X } from 'lucide-react'
import { useState } from 'react'
import {
  MARKETPLACE_TABS,
  TIENDA_CATS,
  NOVEDADES_SUBCATS,
  VACANTES_NIVELES,
  TAB_COLOR,
} from '../../lib/constants'

function Pill({ label, active, onClick, accentColor }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex-shrink-0 ${
        active
          ? 'text-white border-transparent'
          : 'bg-white border-ink-300 text-ink-500 hover:border-ink-400'
      }`}
      style={active ? { background: accentColor, borderColor: accentColor } : {}}
    >
      {label}
    </button>
  )
}

export default function FilterBar({ filters, setFilters }) {
  // La barra de busqueda ahora esta siempre visible

  const set     = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const tab     = filters.tab || 'todo'
  const accent  = TAB_COLOR[tab]?.color || '#7c3aed'
  const hasFilters = tab !== 'todo' || filters.subcategory || filters.search || filters.location

  const setTab = (t) => {
    const tabDef = MARKETPLACE_TABS.find(x => x.value === t)
    setFilters({ tab: t, categories: tabDef?.categories || [], subcategory: tabDef?.subcategory || '' })
    
  }

  const setCat = (v) => setFilters(f => ({ ...f, category: f.category === v ? '' : v, subcategory: '' }))
  const setSub = (v) => set('subcategory', filters.subcategory === v ? '' : v)
  const tiendaCat = TIENDA_CATS.find(c => c.value === filters.category)

  return (
    <div className="rounded-2xl mb-2 overflow-hidden" style={{background:"#ffffff",border: '1px solid #CDDBEC'}}>

      {/* Barra de búsqueda siempre visible, centrada */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="relative max-w-xl mx-auto">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3A6FAE' }} />
          <input
            value={filters.search || ''}
            onChange={e => set('search', e.target.value)}
            placeholder="Buscar en el feed..."
            className="w-full pl-10 pr-9 py-2 rounded-full text-[13px] focus:outline-none transition-colors"
            style={{ background: '#F2F7FF', border: '1.5px solid #CDDBEC', color: '#001A3D' }}
            onFocus={e => e.currentTarget.style.borderColor = '#001A3D'}
            onBlur={e => e.currentTarget.style.borderColor = '#F2F7FF'}
          />
          {filters.search && (
            <button onClick={() => set('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70" aria-label="Limpiar búsqueda">
              <X size={14} style={{ color: '#001A3D' }} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs centrados */}
      <div className="relative flex items-center justify-center px-3 pb-1" style={{ borderTop: '1px solid #DDE7F4' }}>
        <div className="flex gap-1 pt-2 flex-wrap justify-center">
          {MARKETPLACE_TABS.map(t => {
            const active = tab === t.value
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className="px-3 md:px-4 py-1.5 rounded-full text-[11px] md:text-[12px] font-bold transition-all"
                style={{
                  background: active ? '#001A3D' : '#F2F7FF',
                  color:      active ? '#ffffff' : '#5D8BC7',
                  border:     active ? '1.5px solid #001A3D' : '1.5px solid #CDDBEC',
                  boxShadow:  active ? '0 2px 8px rgba(0,26,61,0.35)' : 'none',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        {hasFilters && (
          <button
            onClick={() => setFilters({})}
            className="absolute right-3 top-2.5 text-[11px] font-medium hover:underline"
            style={{ color: accent }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* TIENDA — sin Buscan/Ofrecen */}
      {tab === 'tienda' && (
        <>
          <div className="flex gap-2 px-3 py-2 border-t border-ink-100">
            {TIENDA_CATS.map(c => (
              <Pill key={c.value} label={c.label} active={filters.category === c.value}
                onClick={() => setCat(c.value)} accentColor={accent} />
            ))}
          </div>
          {tiendaCat && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2 border-t border-ink-100 pt-1.5">
              {tiendaCat.subcategories.map(sub => (
                <Pill key={sub} label={sub} active={filters.subcategory === sub}
                  onClick={() => setSub(sub)} accentColor={accent} />
              ))}
            </div>
          )}
        </>
      )}

      {/* INFO (Novedades) */}
      {tab === 'novedades' && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-ink-100">
          {NOVEDADES_SUBCATS.map(sub => (
            <Pill key={sub} label={sub} active={filters.subcategory === sub}
              onClick={() => setSub(sub)} accentColor={accent} />
          ))}
        </div>
      )}

      {/* VACANTES — sin departamentos */}
      {tab === 'vacantes' && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-ink-100">
          {VACANTES_NIVELES.map(lvl => (
            <Pill key={lvl} label={lvl} active={filters.subcategory === lvl}
              onClick={() => setSub(lvl)} accentColor={accent} />
          ))}
        </div>
      )}

    </div>
  )
}
