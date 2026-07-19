// Logo de marca: símbolo de CeQu (Centro Químico), teal oscuro.
export default function CeQuMark({ size = 32, rounded = 'rounded-2xl' }) {
  return (
    <div
      className={`${rounded} flex items-center justify-center flex-shrink-0 select-none`}
      style={{ width: size, height: size, background: '#111111' }}
    >
      <span style={{ fontSize: size * 0.42 }} className="text-white font-bold leading-none">CQ</span>
    </div>
  )
}
