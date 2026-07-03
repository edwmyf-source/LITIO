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
  const [searchOpen, setSearchOpen] = useState(false)

  const set     = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const tab     = filters.tab || 'todo'
  const accent  = TAB_COLOR[tab]?.color || '#7c3aed'
  const hasFilters = tab !== 'todo' || filters.subcategory || filters.search || filters.location

  const setTab = (t) => {
    const tabDef = MARKETPLACE_TABS.find(x => x.value === t)
    setFilters({ tab: t, categories: tabDef?.categories || [], subcategory: tabDef?.subcategory || '' })
    setSearchOpen(false)
  }

  const setCat = (v) => setFilters(f => ({ ...f, category: f.category === v ? '' : v, subcategory: '' }))
  const setSub = (v) => set('subcategory', filters.subcategory === v ? '' : v)
  const tiendaCat = TIENDA_CATS.find(c => c.value === filters.category)

  return (
    <div className="bg-white border border-ink-300 rounded-2xl mb-2 overflow-hidden">

      {/* Tabs + búsqueda */}
      <div className="flex items-center justify-between px-3 pt-2 pb-0">
        <div className="flex gap-1">
          {MARKETPLACE_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="px-2 md:px-3 py-1.5 rounded-2xl text-[11px] md:text-[12px] font-bold transition-all"
              style={{
                background: tab === t.value ? t.color : 'transparent',
                color: tab === t.value ? '#fff' : '#6b7280',
                opacity: tab === t.value ? 1 : 0.55,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={() => setSearchOpen(s => !s)}
            className={`p-1.5 rounded-2xl transition-colors ${searchOpen ? 'text-brand-600' : 'hover:bg-slate-50 text-ink-400'}`}
            style={searchOpen ? { color: accent } : {}}
          >
            <Search size={14} />
          </button>
          {hasFilters && (
            <button
              onClick={() => { setFilters({}); setSearchOpen(false) }}
              className="text-[11px] font-medium hover:underline"
              style={{ color: accent }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      {searchOpen && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={filters.search || ''}
              onChange={e => set('search', e.target.value)}
              placeholder="Buscar en el feed..."
              autoFocus
              className="w-full pl-8 pr-7 py-2 rounded-2xl border border-ink-200 text-[12px] focus:outline-none bg-ink-50"
              style={{ '--tw-ring-color': accent }}
            />
            {filters.search && (
              <button onClick={() => set('search', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

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
