import { EmailPane } from './EmailPane'

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Georgia, serif; background: #f9f9f9; margin: 0; padding: 24px; }
  h1 { font-size: 22px; color: #1a1a1a; margin-bottom: 8px; }
  p { font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 16px; }
  .header { background: #0052cc; padding: 20px 24px; }
  .header h2 { color: #fff; margin: 0; font-size: 18px; }
  .cta { display: inline-block; padding: 10px 20px; background: #0052cc; color: #fff;
         border-radius: 4px; font-size: 14px; font-weight: 600; text-decoration: none; }
  @media (max-width: 480px) {
    body { padding: 12px; }
    h1 { font-size: 18px; }
  }
</style>
</head>
<body>
  <div class="header"><h2>ACME Co.</h2></div>
  <h1>Your order is confirmed!</h1>
  <p>Hi Sam, thanks for your purchase. Order #12345 will ship within 2 business days.</p>
  <a class="cta" href="#">View order details</a>
</body>
</html>`

function App() {
  return (
    <div style={{ display: 'flex', gap: 32, padding: 32, alignItems: 'flex-start' }}>
      <EmailPane html={SAMPLE_HTML} width={800} />
      <EmailPane html={SAMPLE_HTML} width={375} />
    </div>
  )
}

export default App
