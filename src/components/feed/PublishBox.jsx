import { useState, useRef, useEffect } from 'react'
import { X, Send, XCircle, ImagePlus, FileText, Loader2, ShoppingBag, Wrench, Briefcase, Megaphone, MapPin } from 'lucide-react'
import { createPost } from '../../api/posts'
import { CATEGORIES, DEPARTAMENTOS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../shared/Toast'
import { safeErrorMessage } from '../../lib/errors'
import UserAvatar from '../shared/UserAvatar'
import Spinner from '../shared/Spinner'

const NOMINATIM_MAP = {
  'Antioquia':'Antioquia','Bogotá':'Bogotá D.C.','Bogota':'Bogotá D.C.',
  'Cundinamarca':'Cundinamarca','Valle del Cauca':'Valle del Cauca',
  'Atlántico':'Atlántico','Atlantico':'Atlántico','Bolívar':'Bolívar','Bolivar':'Bolívar',
  'Santander':'Santander','Córdoba':'Córdoba','Cordoba':'Córdoba',
  'Nariño':'Nariño','Narino':'Nariño','Tolima':'Tolima','Cauca':'Cauca',
  'Huila':'Huila','Meta':'Meta','Boyacá':'Boyacá','Boyaca':'Boyacá',
  'Caldas':'Caldas','Risaralda':'Risaralda','Magdalena':'Magdalena','Cesar':'Cesar',
  'Norte de Santander':'Norte de Santander','Sucre':'Sucre',
  'Quindío':'Quindío','Quindio':'Quindío','Chocó':'Chocó','Choco':'Chocó',
  'La Guajira':'La Guajira','Caquetá':'Caquetá','Caqueta':'Caquetá',
  'Arauca':'Arauca','Putumayo':'Putumayo','Casanare':'Casanare','Vichada':'Vichada',
  'Amazonas':'Amazonas','Guainía':'Guainía','Guainia':'Guainía',
  'Vaupés':'Vaupés','Vaupes':'Vaupés','Guaviare':'Guaviare','San Andrés':'San Andrés',
}

const detectDepartamento = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es`,
            { headers: { 'User-Agent': 'Litio-App/1.0' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const raw = addr.state || addr.state_district || addr.county || ''
          for (const [key, val] of Object.entries(NOMINATIM_MAP)) {
            if (raw.toLowerCase().includes(key.toLowerCase())) { resolve(val); return }
          }
          const match = DEPARTAMENTOS.find(d =>
            raw.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(raw.toLowerCase())
          )
          resolve(match || null)
        } catch { resolve(null) }
      },
      () => resolve(null),
      { timeout: 6000 }
    )
  })
}

const CAT_ICONS = { productos: ShoppingBag, servicios: Wrench, empleos: Briefcase, informacion: Megaphone }

const CAT_PLACEHOLDER = {
  productos:   'Escribe aquí lo que quieres ofrecer o buscar en productos...',
  servicios:   'Escribe aquí el servicio que ofreces o necesitas...',
  empleos:     'Escribe aquí la vacante que ofreces o el empleo que buscas...',
  informacion: 'Escribe aquí lo que quieres compartir o preguntar a la comunidad...',
  default:     'Ofrezco / busco / comparto...',
}

const MAX_FILES = 5
const MAX_SIZE_MB = 50
const MAX_PX = 1920      // máximo ancho/alto en píxeles
const QUALITY = 0.85     // 85% calidad — indistinguible del original

// Comprime una imagen manteniendo calidad visual
const compressImage = (file) => new Promise((resolve) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    let { width, height } = img
    if (width <= MAX_PX && height <= MAX_PX) { resolve(file); return }
    if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
    else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    canvas.toBlob(
      (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })),
      'image/jpeg', QUALITY
    )
  }
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
  img.src = url
})

// Clasifica el tipo de archivo
const fileKind = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'other'
}

export default function PublishBox({ onClose, onPublished }) {
  const { session } = useAuth()
  const toast = useToast()
  const imageRef = useRef(null)
  const pdfRef   = useRef(null)

  const [form, setForm] = useState({ category: '', subcategory: '', title: '' })
  const [files, setFiles] = useState([])   // [{ file, preview, kind }]
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState(null)
  const [detectingLoc, setDetectingLoc] = useState(true)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const selectedCat = CATEGORIES.find(c => c.value === form.category)
  const valid = form.category && form.title.trim()
  const placeholder = CAT_PLACEHOLDER[form.category] || CAT_PLACEHOLDER.default

  useEffect(() => {
    detectDepartamento().then(dep => { setLocation(dep); setDetectingLoc(false) })
  }, [])

  const addFiles = async (incoming) => {
    const remaining = MAX_FILES - files.length
    if (remaining <= 0) { toast(`Máximo ${MAX_FILES} archivos`, 'error'); return }

    const valid = []
    for (const f of Array.from(incoming).slice(0, remaining)) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast(`${f.name} supera ${MAX_SIZE_MB} MB`, 'error')
        continue
      }
      const kind = fileKind(f)
      const processedFile = kind === 'image' ? await compressImage(f) : f
      const preview = kind === 'image' ? URL.createObjectURL(processedFile) : null
      valid.push({ file: processedFile, preview, kind })
    }
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES))
  }

  const removeFile = (idx) => {
    setFiles(prev => {
      if (prev[idx].preview) URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || loading) return
    setLoading(true)
    try {
      const post = await createPost(
        { author_id: session.user.id, title: form.title.trim(), content: '',
          category: form.category, subcategory: form.subcategory || null, location: location || null },
        files.map(f => f.file)
      )
      onPublished?.(post)
    } catch (err) {
      toast(safeErrorMessage(err), 'error')
    } finally {
      // Garantiza que el botón nunca quede bloqueado aunque haya error silencioso
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-2xl border border-ink-300 text-[13px] focus:outline-none focus:border-brand-600 bg-white'

  return (
    <div className="bg-white border border-ink-300 rounded-2xl p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserAvatar seed={session?.user?.id || 'me'} size={32} />
          <div>
            <span className="font-medium text-sm text-ink-900">¿Qué está pasando?</span>
            {!detectingLoc && location && <p className="text-[10px] text-brand-600 font-medium flex items-center gap-0.5"><MapPin size={10} /> {location}</p>}
            {detectingLoc && <p className="text-[10px] text-ink-400">Detectando ubicación...</p>}
          </div>
        </div>
        <button onClick={onClose} aria-label="Cerrar" className="p-1 rounded hover:bg-slate-50 text-ink-500"><X size={16} /></button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {/* Único textarea */}
        <textarea value={form.title} onChange={e => set('title', e.target.value)}
          placeholder={placeholder} rows={3}
          className={`${inputCls} resize-none`} required maxLength={280} autoFocus />

        {/* Categorías */}
        <div>
          <p className="text-[11px] text-ink-500 font-medium mb-1.5">
            ¿De qué trata? <span className="text-danger-500">*</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(c => {
              const Icon = CAT_ICONS[c.value]
              return (
                <button key={c.value} type="button"
                  onClick={() => { set('category', form.category === c.value ? '' : c.value); set('subcategory', '') }}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-3xl border text-center transition-all ${
                    form.category === c.value
                      ? 'border-brand-500 bg-brand-500/8'
                      : 'border-ink-200 bg-ink-50 hover:border-ink-300 hover:bg-slate-50'
                  }`}>
                  <Icon size={20} className={form.category === c.value ? 'text-brand-600' : 'text-ink-400'} />
                  <span className={`text-[10px] font-medium leading-tight ${form.category === c.value ? 'text-brand-700' : 'text-ink-600'}`}>
                    {c.label}
                  </span>
                </button>
              )
            })}
          </div>
          {!form.category && form.title.trim() && (
            <p className="text-[10.5px] text-danger-500 mt-1.5">Selecciona una categoría para poder publicar.</p>
          )}
        </div>

        {/* Subcategorías */}
        {selectedCat && (
          <div>
            <p className="text-[11px] text-ink-500 font-medium mb-1.5">Subcategoría</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedCat.subcategories.map(s => (
                <button key={s} type="button"
                  onClick={() => set('subcategory', form.subcategory === s ? '' : s)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                    form.subcategory === s
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                      : 'border-ink-200 bg-ink-50 text-ink-600 hover:bg-slate-50'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview archivos adjuntos */}
        {files.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {files.map((f, idx) => (
              <div key={idx} className="relative rounded-3xl overflow-hidden border border-ink-200 bg-ink-50"
                style={{ width: 72, height: 72 }}>
                {f.kind === 'image' && (
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                )}
                {f.kind === 'pdf' && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-1">
                    <FileText size={22} className="text-danger-500" />
                    <span className="text-[9px] text-ink-500 text-center leading-tight line-clamp-2">{f.file.name}</span>
                  </div>
                )}
                {/* Overlay tipo de archivo */}
                <button type="button" onClick={() => removeFile(idx)}
                  className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                  <XCircle size={13} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer — botones de adjuntar + publicar */}
        <div className="flex items-center justify-between pt-1 border-t border-ink-100">
          {/* Inputs ocultos */}
          <input ref={imageRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
          <input ref={pdfRef}   type="file" accept=".pdf" multiple className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = '' }} />

          <div className="flex items-center gap-1.5">
            {/* Botón fotos */}
            <button type="button" disabled={files.length >= MAX_FILES}
              onClick={() => imageRef.current?.click()}
              className={`flex items-center justify-center rounded-3xl border-2 border-dashed transition-all ${
                files.length >= MAX_FILES
                  ? 'border-ink-200 bg-ink-50 opacity-40 cursor-not-allowed'
                  : 'border-ink-300 bg-ink-50 hover:border-brand-400 hover:bg-brand-500/5 cursor-pointer'
              }`}
              style={{ width: 46, height: 46 }}
              title="Foto">
              <ImagePlus size={18} className="text-ink-400" />
            </button>
            {/* Botón PDF */}
            <button type="button" disabled={files.length >= MAX_FILES}
              onClick={() => pdfRef.current?.click()}
              className={`flex items-center justify-center rounded-3xl border-2 border-dashed transition-all ${
                files.length >= MAX_FILES
                  ? 'border-ink-200 bg-ink-50 opacity-40 cursor-not-allowed'
                  : 'border-ink-300 bg-ink-50 hover:border-danger-300 hover:bg-danger-500/5 cursor-pointer'
              }`}
              style={{ width: 46, height: 46 }}
              title="PDF">
              <FileText size={18} className="text-ink-400" />
            </button>

            {files.length > 0 && (
              <span className="text-[10px] text-ink-400 ml-1">{files.length}/{MAX_FILES}</span>
            )}
          </div>

          <button type="submit" disabled={!valid || loading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-2xl disabled:opacity-50 transition-colors">
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> Subiendo...</>
              : <><Send size={13} /> Publicar</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
