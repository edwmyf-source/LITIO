import { useEffect, useRef } from 'react'

// El splash completo (2.4s) solo se muestra una vez por sesion del navegador.
// En recargas (F5) dura 700ms — suficiente para tapar el arranque sin frenar al usuario.
const SPLASH_SEEN_KEY = 'cobalto-splash-seen'

export default function BrandSplash({ onDone }) {
  const doneRef = useRef(false)

  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1' } catch {}
    const duration = seen ? 350 : 1200
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
      background:'#134E4A', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
    }}>
      <style>{`
        @keyframes cbo-core-pulse {
          0%,100% { box-shadow: 0 0 30px rgba(126,182,255,0.55), inset 0 0 14px rgba(126,182,255,0.18); }
          50%     { box-shadow: 0 0 50px rgba(126,182,255,0.85), inset 0 0 14px rgba(126,182,255,0.28); }
        }
        @keyframes cbo-spin { to { transform: rotate(360deg); } }
        @keyframes cbo-brand-in {
          0%   { opacity:0; letter-spacing:0.8em; transform:translateY(10px); }
          100% { opacity:1; letter-spacing:0.5em;  transform:translateY(0); }
        }
        @keyframes cbo-dot {
          0%,100% { opacity:0.25; transform:translateY(0); }
          50%     { opacity:1;    transform:translateY(-4px); }
        }

        .cbo-stage {
          position:relative;
          width:190px; height:190px;
          display:flex; align-items:center; justify-content:center;
          perspective:800px;
        }
        .cbo-core {
          position:absolute; top:50%; left:50%;
          width:72px; height:72px; margin:-36px 0 0 -36px;
          background:#134E4A;
          border:2px solid #5FA39D;
          border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          color:#fff; font-weight:800; font-size:30px;
          font-family:system-ui, -apple-system, sans-serif;
          z-index:5;
          animation: cbo-core-pulse 2.4s ease-in-out infinite;
        }
        .cbo-plane {
          position:absolute; inset:0;
          transform-style:preserve-3d;
        }
        .cbo-p1 { transform: rotateX(70deg) rotateY(0deg);   }
        .cbo-p2 { transform: rotateX(70deg) rotateY(60deg);  }
        .cbo-p3 { transform: rotateX(70deg) rotateY(120deg); }
        .cbo-e  { position:absolute; top:50%; left:50%; width:0; height:0; }
        .cbo-e::before {
          content:''; position:absolute;
          width:92px; height:2px; border-radius:2px;
          transform-origin: 0 50%;
        }
        .cbo-p1 .cbo-e { animation: cbo-spin 1.6s linear infinite; }
        .cbo-p1 .cbo-e::before { background:linear-gradient(90deg, transparent, #5FA39D); }
        .cbo-p2 .cbo-e { animation: cbo-spin 2.0s linear infinite; }
        .cbo-p2 .cbo-e::before { background:linear-gradient(90deg, transparent, #1F6E68); }
        .cbo-p3 .cbo-e { animation: cbo-spin 2.4s linear infinite -0.5s; }
        .cbo-p3 .cbo-e::before { background:linear-gradient(90deg, transparent, #8FC4BE); }

        .cbo-brand {
          color:#fff; font-weight:800; font-size:26px;
          letter-spacing:0.5em;
          font-family: system-ui, -apple-system, sans-serif;
          margin-top:28px;
          padding-left:0.5em; /* balancea el letter-spacing para que quede centrado */
          animation: cbo-brand-in 900ms cubic-bezier(.22,.9,.25,1.1) both;
        }

        .cbo-load {
          display:flex; align-items:center; gap:6px;
          margin-top:22px;
          color:#5FA39D; font-size:12px; letter-spacing:0.18em;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight:500;
        }
        .cbo-load em {
          width:6px; height:6px; border-radius:50%;
          background:#5FA39D; display:inline-block;
          animation: cbo-dot 1.2s ease-in-out infinite;
        }
        .cbo-load em:nth-child(2) { animation-delay:0s;   }
        .cbo-load em:nth-child(3) { animation-delay:0.2s; }
        .cbo-load em:nth-child(4) { animation-delay:0.4s; background:#1F6E68; }
      `}</style>

      {/* Nucleo redondo + 3 estelas 3D en planos cruzados */}
      <div className="cbo-stage">
        <div className="cbo-plane cbo-p1"><div className="cbo-e" /></div>
        <div className="cbo-plane cbo-p2"><div className="cbo-e" /></div>
        <div className="cbo-plane cbo-p3"><div className="cbo-e" /></div>
        <div className="cbo-core">Co</div>
      </div>

      {/* COBALTO con letras separadas */}
      <div className="cbo-brand">COBALTO</div>

      {/* Cargando + puntitos */}
      <div className="cbo-load">
        <span>Cargando</span>
        <em /><em /><em />
      </div>
    </div>
  )
}
