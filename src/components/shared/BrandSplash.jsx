import { useEffect, useRef } from 'react'

export default function BrandSplash({ onDone }) {
  const doneRef = useRef(false)

  useEffect(() => {
    // La animación dura 700ms. Esperamos 900ms para que se vea completa + margen.
    // El usuario también puede tocar para saltarla.
    const t = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone() }
    }, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const skip = () => {
    if (!doneRef.current) { doneRef.current = true; onDone() }
  }

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1b1330', cursor: 'pointer', overflow: 'hidden',
      }}>

      <style>{`
        @keyframes litio-pop {
          0%   { opacity: 0; transform: scale(0.5) rotate(-8deg); }
          60%  { opacity: 1; transform: scale(1.1) rotate(0deg); }
          80%  { transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes litio-label {
          0%,50% { opacity: 0; transform: translateY(10px); }
          100%   { opacity: 1; transform: translateY(0); }
        }
        @keyframes litio-glow {
          0%,40%  { opacity: 0; transform: scale(0.3); }
          65%     { opacity: 0.25; transform: scale(1); }
          100%    { opacity: 0; transform: scale(1.4); }
        }
        .litio-mark {
          width: 100px; height: 100px;
          background: #4c1d8f;
          border-radius: 26px;
          display: flex; align-items: center; justify-content: center;
          animation: litio-pop 700ms cubic-bezier(.22,.9,.25,1.1) both;
          box-shadow: 0 20px 60px rgba(76,29,143,0.5);
        }
        .litio-label {
          color: white; font-weight: 800; font-size: 19px;
          letter-spacing: 0.3em; font-family: system-ui, sans-serif;
          animation: litio-label 700ms ease both;
        }
        .litio-glow {
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
          animation: litio-glow 700ms ease both;
          pointer-events: none;
        }
      `}</style>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div className="litio-glow" />
        <div className="litio-mark">
          <span style={{ color: 'white', fontWeight: 800, fontSize: 44, fontFamily: 'system-ui, sans-serif' }}>Li</span>
        </div>
        <span className="litio-label">LITIO</span>
      </div>
    </div>
  )
}
