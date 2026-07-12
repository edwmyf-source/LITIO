import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, ShieldAlert, CheckCircle, Trash2, Ban, Image, Plus, X } from 'lucide-react'
import { supabase } from '../api/supabase'
import { adminGetUsers, adminGetPosts, adminGetBanners, adminUpsertBanner, adminDeleteBanner, uploadBannerImage, uploadWidgetImage } from '../api/admin'
import { getAdminStats } from '../api/stats'
import { adminGetReports, adminResolveReport, adminRemovePost, adminBanUser } from '../api/moderation'
import Spinner from '../components/shared/Spinner'

const tabs = ['Métricas', 'Usuarios', 'Publicaciones', 'Banners', 'Widgets feed', 'Reportes']
const PAGE_SIZE = 50

function MetricsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then(s => { setStats(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-10"><Spinner size={20} className="text-brand-600" /></div>
  if (!stats) return <p className="text-xs text-ink-500 text-center py-6">No se pudieron cargar las métricas.</p>

  const Kpi = ({ label, value }) => (
    <div className="bg-white border border-ink-300 rounded-2xl p-3.5">
      <p className="text-[10px] uppercase tracking-wider text-ink-500 font-medium mb-1.5">{label}</p>
      <p className="text-2xl font-medium text-ink-900 tracking-tight leading-none">{(value || 0).toLocaleString('es-CO')}</p>
    </div>
  )

  const maxDept = Math.max(...(stats.topDepartments || []).map(d => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Kpi label="Usuarios totales" value={stats.usersTotal} />
        <Kpi label="Publicaciones" value={stats.requests} />
        <Kpi label="Interacciones" value={stats.connections} />
        <Kpi label="Activos esta semana" value={stats.activeThisWeek} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white border border-ink-300 rounded-2xl p-4">
          <p className="text-xs font-medium text-ink-900 mb-3">Por departamento</p>
          {stats.topDepartments.length === 0 ? <p className="text-xs text-ink-500">Sin datos aún.</p> : (
            <div className="space-y-2.5">
              {stats.topDepartments.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-ink-900">{d.name}</span>
                    <span className="text-xs text-ink-500 font-medium">{d.count}</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${(d.count / maxDept) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-ink-300 rounded-2xl p-4">
          <p className="text-xs font-medium text-ink-900 mb-3">Dominios más activos</p>
          {stats.topDomains.length === 0 ? <p className="text-xs text-ink-500">Sin datos aún.</p> : (
            <div className="space-y-2">
              {stats.topDomains.map(d => (
                <div key={d.name} className="flex justify-between items-center">
                  <span className="text-xs text-brand-700 font-mono font-medium">{d.name}</span>
                  <span className="text-xs text-ink-500 font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DataTable({ tab }) {
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true); setPage(0); setSearch('')
    const fns = { 1: adminGetUsers, 2: adminGetPosts }
    fns[tab]?.()
      ?.then(d => { if (mounted) setAllData(d) })
      ?.catch(() => { if (mounted) setAllData([]) })
      ?.finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [tab])

  const filtered = search ? allData.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : allData
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const data = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const thCls = 'text-left text-[11px] font-medium uppercase tracking-wider text-ink-500 px-3 py-2'
  const tdCls = 'text-xs text-ink-900 px-3 py-2 border-t border-ink-100'

  return (
    <>
      <div className="mb-3 flex justify-end">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Buscar..."
          className="px-3 py-2 rounded-2xl border border-ink-300 bg-white text-xs w-48 focus:outline-none focus:border-brand-600" />
      </div>

      <div className="bg-white border border-ink-300 rounded-2xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size={20} className="text-brand-600" /></div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-ink-100">
                  {tab === 1 && <><th className={thCls}>Nombre</th><th className={thCls}>Email</th><th className={thCls}>Empresa</th><th className={thCls}>Ciudad</th></>}
                  {tab === 2 && <><th className={thCls}>Título</th><th className={thCls}>Categoría</th><th className={thCls}>Subcategoría</th><th className={thCls}>Autor</th></>}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    {tab === 1 && <><td className={tdCls}>{row.full_name || '—'}</td><td className={tdCls}>{row.email || '—'}</td><td className={tdCls}>{row.company_name || '—'}</td><td className={tdCls}>{row.city || '—'}</td></>}
                    {tab === 2 && <><td className={tdCls}>{row.title}</td><td className={tdCls}>{row.category || '—'}</td><td className={tdCls}>{row.subcategory || '—'}</td><td className={tdCls}>{row.profiles?.full_name || '—'}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-ink-100 bg-ink-100/30">
              <span className="text-xs text-ink-500">{filtered.length} registros</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="p-1 rounded hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <span className="text-xs text-ink-900">{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="p-1 rounded hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}


function ModerationTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = () => {}  // simple fallback

  useEffect(() => {
    adminGetReports()
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  const resolve = async (id, action, postId, userId) => {
    try {
      if (action === 'post_removed' && postId) await adminRemovePost(postId)
      if (action === 'user_banned' && userId) await adminBanUser(userId)
      await adminResolveReport(id, action)
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: action } : r))
    } catch (e) { console.error(e) }
  }

  const pending = reports.filter(r => r.status === 'pending')
  const resolved = reports.filter(r => r.status !== 'pending')

  if (loading) return <div className="flex justify-center py-10"><Spinner size={20} className="text-brand-600" /></div>

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={16} className="text-danger-500" />
        <span className="text-sm font-medium text-ink-900">Reportes pendientes ({pending.length})</span>
      </div>

      {pending.length === 0 && (
        <div className="bg-white border border-ink-300 rounded-2xl p-6 text-center">
          <CheckCircle size={24} className="text-success-500 mx-auto mb-2" />
          <p className="text-sm text-ink-500">Sin reportes pendientes</p>
        </div>
      )}

      {pending.map(r => (
        <div key={r.id} className="bg-white border border-ink-300 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-medium text-ink-900 mb-0.5">
                Reportado por: <span className="text-brand-600">{r.reporter?.full_name || `Usuario-${r.reporter?.identity_number}`}</span>
              </p>
              <p className="text-xs text-ink-500">Motivo: <span className="font-medium text-ink-700">{r.reason}</span></p>
              {r.posts && <p className="text-xs text-ink-500 mt-1">Post: <span className="font-medium text-ink-700 line-clamp-1">{r.posts.title}</span></p>}
            </div>
            <span className="text-[10px] text-ink-400 flex-shrink-0">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => resolve(r.id, 'dismissed', null, null)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-2xl border border-ink-200 text-ink-600 hover:bg-ink-50">
              <CheckCircle size={12} /> Desestimar
            </button>
            <button onClick={() => resolve(r.id, 'post_removed', r.post_id, null)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-2xl border border-danger-200 text-danger-600 hover:bg-danger-50">
              <Trash2 size={12} /> Eliminar post
            </button>
            <button onClick={() => resolve(r.id, 'user_banned', r.post_id, r.posts?.author_id)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-2xl border border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100 font-medium">
              <Ban size={12} /> Banear usuario
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-ink-500 cursor-pointer hover:text-ink-700 font-medium">
            Ver {resolved.length} reportes resueltos
          </summary>
          <div className="mt-2 space-y-2">
            {resolved.map(r => (
              <div key={r.id} className="bg-ink-50 border border-ink-200 rounded-2xl p-3 opacity-70">
                <p className="text-xs text-ink-600">{r.reason}</p>
                <p className="text-[10px] text-ink-400 mt-1">Estado: {r.status}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function BannersTab() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const load = () => {
    setLoading(true)
    adminGetBanners()
      .then(setBanners)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (banners.length >= 5) { setError('Máximo 5 banners activos.'); return }
    setError('')
    setUploading(true)
    try {
      const url = await uploadBannerImage(file)
      await adminUpsertBanner({ image_url: url, position: banners.length + 1, active: true })
      load()
    } catch (err) {
      setError(err.message || 'Error al subir la imagen.')
    }
    setUploading(false)
    e.target.value = ''
  }

  const toggleActive = async (banner) => {
    try {
      await adminUpsertBanner({ ...banner, active: !banner.active })
      load()
    } catch {}
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar este banner?')) return
    try {
      await adminDeleteBanner(id)
      load()
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image size={16} className="text-brand-600" />
          <span className="text-sm font-medium text-ink-900">Banners "De interés"</span>
          <span className="text-xs text-ink-500">({banners.length}/5)</span>
        </div>
        {banners.length < 5 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-2xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : <><Plus size={13} /> Agregar imagen</>}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {error && <p className="text-xs text-danger-500">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : banners.length === 0 ? (
        <div className="bg-white border border-ink-300 rounded-2xl p-8 text-center">
          <Image size={28} className="text-ink-300 mx-auto mb-2" />
          <p className="text-sm text-ink-500">No hay banners aún.</p>
          <p className="text-xs text-ink-400 mt-1">Agrega hasta 5 imágenes que aparecerán en el carrusel del feed.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {banners.map((banner, i) => (
            <div key={banner.id} className="bg-white border border-ink-300 rounded-2xl overflow-hidden flex items-center gap-3 p-2.5">
              <img src={banner.image_url} alt="" className="w-24 h-14 object-cover rounded-2xl flex-shrink-0 border border-ink-200" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink-900">Banner #{i + 1}</p>
                <p className="text-[10px] text-ink-400 truncate">{banner.image_url.split('/').pop()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(banner)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-2xl border ${
                    banner.active
                      ? 'border-brand-600 text-brand-600 bg-brand-50'
                      : 'border-ink-300 text-ink-500 bg-ink-50'
                  }`}
                >
                  {banner.active ? 'Activo' : 'Inactivo'}
                </button>
                <button onClick={() => remove(banner.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 rounded-2xl">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-ink-400">
        Las imágenes activas aparecen en el carrusel "De interés" arriba del feed para todos los usuarios.
        Recomendado: formato 16:7 horizontal (ej. 1600×700px).
      </p>
    </div>
  )
}

const WIDGET_FORM_DEFAULT = { titulo: '', imagen_url: '', imagen_emoji: '🧪', imagen_gradient: 'linear-gradient(135deg,#001A3D,#2F80ED)', btn_url: '', btn_texto: 'Más información', btn_color: '#F2F7FF', btn_text_color: '#2F80ED', orden: 0, activo: true }

function WidgetsTab() {
  const [widgets, setWidgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(WIDGET_FORM_DEFAULT)
  const fileRef = useRef(null)

  const loadWidgets = () => {
    setLoading(true)
    supabase.from('feed_widgets').select('*').order('orden')
      .then(({ data }) => { setWidgets(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useState(() => { loadWidgets() }, [])

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadingImg(true)
    try {
      const url = await uploadWidgetImage(file)
      setForm(f => ({ ...f, imagen_url: url }))
    } catch (err) {
      setUploadError(err.message || 'Error al subir la imagen.')
    }
    setUploadingImg(false)
    e.target.value = ''
  }

  const save = async () => {
    if (!form.titulo || !form.btn_url) return
    setSaving(true)
    if (editId) {
      await supabase.from('feed_widgets').update(form).eq('id', editId)
    } else {
      await supabase.from('feed_widgets').insert(form)
    }
    setSaving(false)
    setEditId(null)
    setForm({ ...WIDGET_FORM_DEFAULT, orden: widgets.length })
    loadWidgets()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar este widget?')) return
    await supabase.from('feed_widgets').delete().eq('id', id)
    loadWidgets()
  }

  const edit = (w) => {
    setEditId(w.id)
    setForm({ titulo: w.titulo, imagen_url: w.imagen_url || '', imagen_emoji: w.imagen_emoji, imagen_gradient: w.imagen_gradient, btn_url: w.btn_url, btn_texto: w.btn_texto, btn_color: w.btn_color, btn_text_color: w.btn_text_color, orden: w.orden, activo: w.activo })
  }

  const GRADIENTS = [
    'linear-gradient(135deg,#001A3D,#2F80ED)',
    'linear-gradient(135deg,#1b5e20,#43a047)',
    'linear-gradient(135deg,#4a148c,#7b1fa2)',
    'linear-gradient(135deg,#880e4f,#c2185b)',
    'linear-gradient(135deg,#e65100,#f57f17)',
    'linear-gradient(135deg,#006064,#0097a7)',
  ]

  const fld = 'w-full border border-ink-200 rounded-lg px-3 py-2 text-xs text-ink-900 bg-white font-sans'

  return (
    <div className="space-y-6">
      {/* Lista de widgets */}
      <div className="bg-white rounded-2xl border border-ink-200 p-4">
        <p className="text-sm font-bold text-ink-900 mb-3">Widgets activos en columna derecha del feed</p>
        {loading ? <p className="text-xs text-ink-400">Cargando...</p> : widgets.length === 0 ? <p className="text-xs text-ink-400">No hay widgets. Crea el primero abajo.</p> : (
          <div className="space-y-2">
            {widgets.map(w => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-ink-200">
                {w.imagen_url ? (
                  <img src={w.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-ink-200" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: w.imagen_gradient }}>
                    {w.imagen_emoji}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-900 truncate">{w.titulo}</p>
                  <p className="text-[10px] text-ink-400 truncate">{w.btn_url}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${w.activo ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                  {w.activo ? 'Activo' : 'Inactivo'}
                </span>
                <button onClick={() => edit(w)} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-ink-50 text-ink-700 hover:bg-blue-50">Editar</button>
                <button onClick={() => remove(w.id)} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-ink-200 p-4">
        <p className="text-sm font-bold text-ink-900 mb-4">{editId ? '✏️ Editar widget' : '➕ Nuevo widget'}</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-ink-600 mb-1 block">Título del widget</label>
            <input className={fld} value={form.titulo} onChange={e => setForm(f => ({...f, titulo: e.target.value}))} placeholder="Ej: Congreso Nacional de Química 2026" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-ink-600 mb-2 block">Imagen del widget (1:1, recomendado 400×400px)</label>
            <div className="flex items-center gap-3">
              {form.imagen_url ? (
                <img src={form.imagen_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-ink-200 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ background: form.imagen_gradient }}>
                  {form.imagen_emoji}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                className="text-xs font-medium px-3 py-1.5 rounded-xl bg-ink-100 text-ink-700 hover:bg-blue-50 disabled:opacity-50">
                {uploadingImg ? 'Subiendo...' : form.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {form.imagen_url && (
                <button onClick={() => setForm(f => ({...f, imagen_url: ''}))}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                  Quitar imagen
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </div>
            {uploadError && <p className="text-[10px] text-red-500 mt-1">{uploadError}</p>}
            <p className="text-[9px] text-ink-400 mt-1">Si no subes una imagen, se usará el emoji y color de fondo de respaldo.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-ink-600 mb-1 block">Emoji de respaldo (si no hay imagen)</label>
              <input className={fld} value={form.imagen_emoji} onChange={e => setForm(f => ({...f, imagen_emoji: e.target.value}))} placeholder="🧪" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-600 mb-1 block">Orden (1 = primero)</label>
              <input type="number" className={fld} value={form.orden} onChange={e => setForm(f => ({...f, orden: Number(e.target.value)}))} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-ink-600 mb-2 block">Color de fondo de respaldo (si no hay imagen)</label>
            <div className="flex gap-2 flex-wrap">
              {GRADIENTS.map(g => (
                <button key={g} onClick={() => setForm(f => ({...f, imagen_gradient: g}))}
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{ background: g, borderColor: form.imagen_gradient === g ? '#001A3D' : 'transparent' }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-ink-600 mb-1 block">URL del botón (página, WhatsApp, email, etc.)</label>
            <input className={fld} value={form.btn_url} onChange={e => setForm(f => ({...f, btn_url: e.target.value}))} placeholder="https://... o wa.me/+57... o mailto:..." />
            <p className="text-[9px] text-ink-400 mt-1">Acepta cualquier URL: web, WhatsApp (wa.me), correo (mailto:), Instagram, etc.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-ink-600 mb-1 block">Texto del botón</label>
              <input className={fld} value={form.btn_texto} onChange={e => setForm(f => ({...f, btn_texto: e.target.value}))} placeholder="Más información" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-600 mb-1 block">Vista previa del botón</label>
              <div className="flex items-center h-9">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md"
                  style={{ background: form.btn_color, color: form.btn_text_color }}>
                  {form.btn_texto || 'Más información'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="wactivo" checked={form.activo} onChange={e => setForm(f => ({...f, activo: e.target.checked}))} style={{ accentColor: '#2F80ED' }} />
            <label htmlFor="wactivo" className="text-xs text-ink-600">Publicar (visible para todos los usuarios)</label>
          </div>
          <div className="flex gap-2 pt-1">
            {editId && (
              <button onClick={() => { setEditId(null); setForm(WIDGET_FORM_DEFAULT); setUploadError('') }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-ink-100 text-ink-700">
                Cancelar
              </button>
            )}
            <button onClick={save} disabled={saving || !form.titulo || !form.btn_url}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
              style={{ background: '#2F80ED' }}>
              {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear widget'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState(0)

  return (
    <div className="page-enter space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`text-xs font-medium px-3 py-1.5 rounded-2xl ${
              tab === i ? 'bg-brand-600 text-white' : 'bg-white text-ink-900 hover:bg-slate-50 border border-ink-300'
            }`}>
            {i === 0 && <TrendingUp size={12} className="inline mr-1 -mt-0.5" />}
            {t}
          </button>
        ))}
      </div>
      {tab === 0 ? <MetricsTab /> : tab === 3 ? <BannersTab /> : tab === 4 ? <WidgetsTab /> : tab === 5 ? <ModerationTab /> : <DataTable tab={tab} />}
    </div>
  )
}
