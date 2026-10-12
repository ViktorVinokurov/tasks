export function LiquidBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <span className="liquid-orb liquid-orb-green" />
      <span className="liquid-orb liquid-orb-amber" />
      <span className="liquid-orb liquid-orb-blue" />
    </div>
  )
}
