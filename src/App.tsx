import { useState, useCallback } from 'react'
import { EmailPane } from './EmailPane'
import { WidthPicker } from './WidthPicker'
import { DropZone } from './DropZone'
import { parseEmail } from './parseEmail'
import './App.css'

const DESKTOP_PRESETS = [800, 1024, 1280]
const MOBILE_PRESETS = [375, 390, 414]

function App() {
  const [parsedHtml, setParsedHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [desktopWidth, setDesktopWidth] = useState(800)
  const [mobileWidth, setMobileWidth] = useState(375)

  const handleLoad = useCallback(async (raw: string | ArrayBuffer) => {
    setLoading(true)
    setError(null)
    try {
      const { html } = await parseEmail(raw)
      setParsedHtml(html)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse email')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = () => {
    setParsedHtml(null)
    setError(null)
  }

  if (!parsedHtml) {
    return <DropZone onLoad={handleLoad} loading={loading} error={error} />
  }

  return (
    <div className="app">
      <header className="controls">
        <WidthPicker
          label="Desktop"
          value={desktopWidth}
          options={DESKTOP_PRESETS}
          onChange={setDesktopWidth}
        />
        <div className="controls__divider" />
        <WidthPicker
          label="Mobile"
          value={mobileWidth}
          options={MOBILE_PRESETS}
          onChange={setMobileWidth}
        />
        <div className="controls__spacer" />
        <button className="controls__reset" onClick={handleReset}>
          Load another
        </button>
      </header>

      <main className="panes">
        <EmailPane html={parsedHtml} width={desktopWidth} label="Desktop" />
        <EmailPane html={parsedHtml} width={mobileWidth} label="Mobile" />
      </main>
    </div>
  )
}

export default App
