import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { supabase } from '../../api/supabase'

export default function FeedWidgets() {
  const [widgets, setWidgets] = useState([])

  useEffect(() => {
    supabase
      .from('feed_widgets')
      .select('*')
      .eq('activo', true)
      .order('orden')
      .limit(3)
      .then(({ data }) => { if (data) setWidgets(data) })
      .catch(() => {})
  }, [])

  if (!widgets.length) return null

  return (
    <div className="flex flex-col gap-3">
      {widgets.map(w => (
        <div key={w.id} className="bg-white rounded-xl overflow-hidden"
          style={{ border: '1px solid #e0e0e0' }}>

          {/* Imagen 1:1 */}
          {w.imagen_url ? (
            <img src={w.imagen_url} alt={w.titulo}
              className="w-full object-cover" style={{ aspectRatio: '1/1' }} />
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-2"
              style={{ aspectRatio: '1/1', background: w.imagen_gradient || 'linear-gradient(135deg,#0047AB,#2F80ED)' }}>
              <span style={{ fontSize: 52 }}>{w.imagen_emoji || '🧪'}</span>
            </div>
          )}

          {/* Body */}
          <div className="p-3">
            <p className="text-[9px] flex items-center gap-1 mb-1" style={{ color: '#bbb' }}>
              <span>⚙</span> Configurado por admin
            </p>
            <p className="text-[12px] font-semibold leading-snug mb-2" style={{ color: '#000', lineHeight: 1.4 }}>
              {w.titulo}
            </p>
            <a href={w.btn_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ background: w.btn_color || '#F2F7FF', color: w.btn_text_color || '#2F80ED' }}>
              <ExternalLink size={11} />
              {w.btn_texto || 'Más información'}
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
