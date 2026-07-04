import { useState } from 'react'
import { EmailPane } from './EmailPane'
import { WidthPicker } from './WidthPicker'
import './App.css'

const DESKTOP_PRESETS = [800, 1024, 1280]
const MOBILE_PRESETS = [375, 390, 414]

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Georgia, serif; background: #f9f9f9; margin: 0; padding: 0; }
  .header { background: #0052cc; padding: 20px 24px; }
  .header h2 { color: #fff; margin: 0; font-size: 18px; font-family: sans-serif; }
  .body { padding: 24px; }
  h1 { font-size: 22px; color: #1a1a1a; margin: 0 0 8px; }
  p { font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; padding: 10px 20px; background: #0052cc; color: #fff;
         border-radius: 4px; font-size: 14px; font-weight: 600; text-decoration: none; }
  .footer { padding: 16px 24px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
  @media (max-width: 480px) {
    .body { padding: 16px; }
    h1 { font-size: 18px; }
  }
</style>
</head>
<body>
  <div class="header"><h2>ACME Co.</h2></div>
  <div class="body">
    <h1>Your order is confirmed!</h1>
    <p>Hi Sam, thanks for your purchase. Order #12345 will ship within 2 business days.</p>
    <a class="cta" href="#">View order details</a>
  </div>
  <div class="footer">ACME Co. · 123 Main St · Unsubscribe</div>
</body>
</html>`

function App() {
  const [desktopWidth, setDesktopWidth] = useState(800)
  const [mobileWidth, setMobileWidth] = useState(375)

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
      </header>

      <main className="panes">
        <div className="pane-col">
          <div className="pane-label">Desktop — {desktopWidth}px</div>
          <EmailPane html={SAMPLE_HTML} width={desktopWidth} />
        </div>
        <div className="pane-col">
          <div className="pane-label">Mobile — {mobileWidth}px</div>
          <EmailPane html={SAMPLE_HTML} width={mobileWidth} />
        </div>
      </main>
    </div>
  )
}

export default App
