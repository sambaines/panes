import { useRef, useEffect } from 'react'
import { prepareEmailHtml } from './scopeCss'

interface Props {
  html: string
  width: number
}

export function EmailPane({ html, width }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = prepareEmailHtml(html)
  }, [html])

  return (
    <div style={{ width, flexShrink: 0 }}>
      <div ref={ref} />
    </div>
  )
}
