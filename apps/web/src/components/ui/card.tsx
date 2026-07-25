export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`panel p-5 md:p-6 ${className || ""}`} style={style}>
      {children}
    </div>
  )
}
