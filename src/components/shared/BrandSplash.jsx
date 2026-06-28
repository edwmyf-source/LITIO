import { useEffect } from 'react'

export default function BrandSplash({ onDone }) {
  useEffect(() => {
    // Splash corto: 0.9s es suficiente para la animación sin retrasar el arranque
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div onClick={onDone}
      className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar cursor-pointer overflow-hidden">

      <style>{`
        @keyframes litioWordIn {
          0%   { opacity: 0; transform: scale(.8); }
          18%  { opacity: 1; transform: scale(1); }
          42%  { opacity: 1; transform: scale(1); }
          62%  { opacity: 0; transform: scale(1.35); }
          100% { opacity: 0; }
        }
        @keyframes litioMarkPop {
          0%   { opacity: 0; transform: scale(.12) rotate(-8deg); }
          42%  { opacity: 0; transform: scale(.12) rotate(-8deg); }
          68%  { opacity: 1; transform: scale(1.14) rotate(0deg); }
          82%  { opacity: 1; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes litioLabelIn {
          0%   { opacity: 0; transform: translateY(10px); }
          68%  { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes litioGlow {
          0%   { opacity: 0; }
          42%  { opacity: 0; }
          68%  { opacity: .35; }
          100% { opacity: 0; }
        }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 320, height: 260 }}>

        {/* Fase 1: la palabra completa LITIO */}
        <span
          className="absolute font-extrabold text-white tracking-[0.18em]"
          style={{ fontSize: 'clamp(34px, 9vw, 56px)', animation: 'litioWordIn 900ms ease forwards' }}
        >
          LITIO
        </span>

        {/* Destello al desprenderse */}
        <div
          className="absolute rounded-full"
          style={{ width: 180, height: 180, background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animation: 'litioGlow 900ms ease forwards' }}
        />

        {/* Fase 2: el "Li" se desprende y crece; LITIO queda escrito abajo */}
        <div className="absolute flex flex-col items-center gap-5">
          <div
            className="rounded-[28px] flex items-center justify-center shadow-2xl"
            style={{ width: 112, height: 112, background: '#4c1d8f', animation: 'litioMarkPop 900ms cubic-bezier(.22,.9,.25,1.1) forwards' }}
          >
            <span className="text-white font-extrabold" style={{ fontSize: 48 }}>Li</span>
          </div>
          <span
            className="font-bold text-white tracking-[0.3em]"
            style={{ fontSize: 20, animation: 'litioLabelIn 900ms ease forwards' }}
          >
            LITIO
          </span>
        </div>
      </div>
    </div>
  )
}
