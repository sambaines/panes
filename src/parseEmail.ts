import PostalMime from 'postal-mime'

export interface ParsedEmail {
  html: string
}

export async function parseEmail(raw: string | ArrayBuffer): Promise<ParsedEmail> {
  // Bare HTML (pasted directly) — no MIME parsing needed
  if (typeof raw === 'string' && raw.trimStart().startsWith('<')) {
    return { html: sanitise(raw) }
  }

  const email = await PostalMime.parse(raw)

  if (!email.html) {
    throw new Error("Couldn't find an HTML part in this message")
  }

  let html = email.html

  // Resolve cid: inline image references → data: URIs
  for (const attachment of email.attachments ?? []) {
    if (!attachment.contentId || !attachment.content) continue
    const cid = attachment.contentId.replace(/^<|>$/g, '')
    const dataUri = `data:${attachment.mimeType};base64,${toBase64(attachment.content)}`
    html = html.replaceAll(`cid:${cid}`, dataUri)
  }

  return { html: sanitise(html) }
}

function sanitise(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script').forEach(el => el.remove())
  return doc.documentElement.outerHTML
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
