import { useRef, useEffect } from 'react'
import { prepareEmailHtml } from './scopeCss'

interface Props {
  html: string
  width: number
}

export function EmailPane({ html, width }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const inject = () => {
      if (ref.current) ref.current.innerHTML = prepareEmailHtml(html)
    }

    inject()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', inject)
    return () => mq.removeEventListener('change', inject)
  }, [html])

  return (
    <div style={{ width, flexShrink: 0 }}>
      <div ref={ref} />
    </div>
  )
}
