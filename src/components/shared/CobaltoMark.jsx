// Logo de marca: símbolo del Cobalto (Co), azul cobalto.
export default function CobaltoMark({ size = 32, rounded = 'rounded-2xl' }) {
  return (
    <div
      className={`${rounded} flex items-center justify-center flex-shrink-0 select-none`}
      style={{ width: size, height: size, background: '#001A3D' }}
    >
      <span style={{ fontSize: size * 0.46 }} className="text-white font-bold leading-none">Co</span>
    </div>
  )
}
