import { useEffect, useRef } from 'react'

// El splash completo (3s) solo se muestra una vez por sesión del navegador.
// En recargas (F5) dura 600ms — suficiente para tapar el arranque sin frenar al usuario.
const SPLASH_SEEN_KEY = 'cobalto-splash-seen'

export default function BrandSplash({ onDone }) {
  const doneRef = useRef(false)

  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1' } catch {}
    const duration = seen ? 600 : 3000
    try { sessionStorage.setItem(SPLASH_SEEN_KEY, '1') } catch {}
    const t = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone() }
    }, duration)
    return () => clearTimeout(t)
  }, [onDone])

  const skip = () => {
    if (!doneRef.current) { doneRef.current = true; onDone() }
  }

  return (
    <div onClick={skip} style={{
      position:'fixed', inset:0, zIndex:9999, cursor:'pointer', overflow:'hidden',
      background:'#001A3D', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
    }}>
      <style>{`
        @keyframes rh-pop {
          0%   { opacity:0; transform:scale(0.5) rotate(-8deg); }
          60%  { opacity:1; transform:scale(1.1) rotate(0deg); }
          80%  { transform:scale(0.97); }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes rh-label {
          0%,55% { opacity:0; transform:translateY(10px); }
          100%   { opacity:1; transform:translateY(0); }
        }
        @keyframes rh-ring {
          0%   { opacity:0; transform:scale(0.6); }
          60%  { opacity:1; transform:scale(1.05); }
          100% { opacity:0.35; transform:scale(1); }
        }
        @keyframes orbit1 {
          from { transform:rotate(0deg)   translateX(72px) rotate(0deg); }
          to   { transform:rotate(360deg) translateX(72px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform:rotate(120deg) translateX(72px) rotate(-120deg); }
          to   { transform:rotate(480deg) translateX(72px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          from { transform:rotate(240deg) translateX(72px) rotate(-240deg); }
          to   { transform:rotate(600deg) translateX(72px) rotate(-600deg); }
        }
        @keyframes dot-pulse {
          0%,100% { opacity:0.35; transform:scale(0.8); }
          50%     { opacity:1;    transform:scale(1); }
        }
        .rh-ring {
          position:absolute; width:144px; height:144px; border-radius:50%;
          border:1.5px dashed rgba(47,128,237,0.35);
          animation: rh-ring 800ms ease both;
        }
        .rh-mark {
          width:100px; height:100px; background:#2F80ED; border-radius:26px;
          display:flex; align-items:center; justify-content:center;
          animation: rh-pop 700ms cubic-bezier(.22,.9,.25,1.1) both;
          box-shadow: 0 0 0 8px rgba(0,26,61,0.25), 0 20px 60px rgba(0,26,61,0.5);
          position:relative; z-index:2;
        }
        .rh-atom {
          position:absolute; top:50%; left:50%;
          width:12px; height:12px; margin:-6px 0 0 -6px;
        }
        .rh-atom .dot {
          width:12px; height:12px; border-radius:50%;
          background:rgba(47,128,237,0.9);
          box-shadow:0 0 8px rgba(47,128,237,0.6);
        }
        .rh-atom:nth-child(2) { animation: orbit1 3.2s linear infinite; }
        .rh-atom:nth-child(3) { animation: orbit2 3.2s linear infinite; }
        .rh-atom:nth-child(4) { animation: orbit3 3.2s linear infinite; }
        .rh-label {
          color:white; font-weight:800; font-size:20px; letter-spacing:0.32em;
          font-family:system-ui,sans-serif; margin-top:28px;
          animation: rh-label 900ms ease both;
        }
        .rh-dots { display:flex; gap:8px; margin-top:20px; animation: rh-label 1100ms ease both; }
        .rh-dots span {
          width:7px; height:7px; border-radius:50%; background:rgba(47,128,237,0.6);
          display:block;
        }
        .rh-dots span:nth-child(1) { animation: dot-pulse 1.2s ease-in-out infinite 0s; }
        .rh-dots span:nth-child(2) { animation: dot-pulse 1.2s ease-in-out infinite 0.24s; }
        .rh-dots span:nth-child(3) { animation: dot-pulse 1.2s ease-in-out infinite 0.48s; }
        .rh-dots span:nth-child(4) { animation: dot-pulse 1.2s ease-in-out infinite 0.72s; }
        .rh-dots span:nth-child(5) { animation: dot-pulse 1.2s ease-in-out infinite 0.96s; }
      `}</style>

      {/* Centro: anillo + partículas + logo */}
      <div style={{ position:'relative', width:160, height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="rh-ring" />
        <div className="rh-atom"><div className="dot" /></div>
        <div className="rh-atom"><div className="dot" /></div>
        <div className="rh-atom"><div className="dot" /></div>
        <div className="rh-mark">
          <span style={{ color:'white', fontWeight:800, fontSize:44, fontFamily:'system-ui,sans-serif' }}>Co</span>
        </div>
      </div>

      {/* Nombre — perfectamente centrado bajo el logo */}
      <div className="rh-label">COBALTO</div>

      {/* Pepitas de carga */}
      <div className="rh-dots">
        <span /><span /><span /><span /><span />
      </div>
    </div>
  )
}
