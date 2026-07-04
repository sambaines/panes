import { useRef, useEffect, useState } from 'react'
import { toPng } from 'html-to-image'
import { prepareEmailHtml } from './scopeCss'

interface Props {
  html: string
  width: number
  label: string
}

export function EmailPane({ html, width, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const inject = () => {
      if (ref.current) ref.current.innerHTML = prepareEmailHtml(html)
    }

    inject()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', inject)
    return () => mq.removeEventListener('change', inject)
  }, [html])

  const handleSave = async () => {
    if (!ref.current || saving) return
    setSaving(true)
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `email-${label.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('PNG export failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pane-col" style={{ '--pane-width': `${width}px` } as React.CSSProperties}>
      <div className="pane-header">
        <span className="pane-label">{label} — {width}px</span>
        <button
          className="pane-save"
          onClick={handleSave}
          disabled={saving}
          title="Save as PNG"
        >
          {saving ? (
            <span className="pane-save__spinner" />
          ) : (
            <CameraIcon />
          )}
        </button>
      </div>
      <div style={{ width, flexShrink: 0 }}>
        <div ref={ref} />
      </div>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2L4.5 3.5H2a1 1 0 0 0-1 1V12a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V4.5a1 1 0 0 0-1-1h-2.5L9.5 2h-4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="7.5" cy="7.75" r="2.25" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}
