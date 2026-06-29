import { useEffect, useState } from 'react'

export default function BrandSplash({ onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Forzar un frame antes de animar para que el navegador pinte el fondo primero
    const raf = requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(onDone, 500)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [onDone])

  return (
    <div onClick={onDone}
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
      style={{ background: '#1b1330' }}>

      <style>{`
        @keyframes markPop {
          0%   { opacity: 0; transform: scale(.55) rotate(-6deg); }
          65%  { opacity: 1; transform: scale(1.08) rotate(0deg); }
          82%  { transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes labelIn {
          0%   { opacity: 0; transform: translateY(8px); }
          55%  { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-4"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 80ms' }}>
        <div
          className="rounded-[24px] flex items-center justify-center shadow-2xl"
          style={{
            width: 96, height: 96, background: '#4c1d8f',
            animation: visible ? 'markPop 500ms cubic-bezier(.22,.9,.25,1.1) forwards' : 'none',
          }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 42 }}>Li</span>
        </div>
        <span
          style={{
            color: 'white', fontWeight: 700, fontSize: 18, letterSpacing: '0.28em',
            animation: visible ? 'labelIn 500ms ease forwards' : 'none',
          }}>
          LITIO
        </span>
      </div>
    </div>
  )
}
