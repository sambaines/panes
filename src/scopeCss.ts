const SCOPE = 'ep'

// Applied before any email CSS so the wrapper is a container query context.
const BASE_CSS = `.${SCOPE} { container-type: inline-size; }`

export function prepareEmailHtml(rawHtml: string): string {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html')

  // Collect and remove all <style> elements
  const styleTexts: string[] = []
  doc.querySelectorAll('style').forEach(el => {
    styleTexts.push(el.textContent ?? '')
    el.remove()
  })

  const scopedCss = styleTexts
    .map(css => scopeCss(css))
    .join('\n')

  // Carry over any inline style/bgcolor attributes from <body>
  const body = doc.body
  const bodyStyle = body.getAttribute('style') ?? ''
  const bodyBg = body.getAttribute('bgcolor') ?? ''
  const wrapperStyle = [bodyStyle, bodyBg ? `background-color:${bodyBg}` : '']
    .filter(Boolean)
    .join(';')

  const parts = [
    `<style>${BASE_CSS}${scopedCss}</style>`,
    `<div class="${SCOPE}"${wrapperStyle ? ` style="${wrapperStyle}"` : ''}>`,
    body.innerHTML,
    '</div>',
  ]

  return parts.filter(Boolean).join('\n')
}

function scopeCss(css: string): string {
  try {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(css)
    return rewriteRules(sheet.cssRules)
  } catch {
    return ''
  }
}

function rewriteRules(rules: CSSRuleList): string {
  return Array.from(rules).map(rewriteRule).join('\n')
}

function rewriteRule(rule: CSSRule): string {
  if (rule instanceof CSSImportRule) {
    return ''
  }
  if (rule instanceof CSSStyleRule) {
    return `${scopeSelector(rule.selectorText)} { ${rule.style.cssText} }`
  }
  if (rule instanceof CSSMediaRule) {
    const container = toContainerCondition(rule.conditionText)
    if (container) {
      // Width-only query — use @container so it measures the pane, not the viewport
      return `@container ${container} { ${rewriteRules(rule.cssRules)} }`
    }
    return `@media ${rule.conditionText} { ${rewriteRules(rule.cssRules)} }`
  }
  if (rule instanceof CSSSupportsRule) {
    return `@supports ${rule.conditionText} { ${rewriteRules(rule.cssRules)} }`
  }
  // @keyframes, @font-face, @charset — pass through unchanged
  return rule.cssText
}

function scopeSelector(selectorText: string): string {
  return selectorText
    .split(',')
    .map(part => {
      const s = part.trim()
      if (/^(?:html|body|:root)$/.test(s)) return `.${SCOPE}`
      const m = s.match(/^(?:html|body)\s*[>+~\s](.+)/)
      if (m) return `.${SCOPE} ${m[1].trim()}`
      return `.${SCOPE} ${s}`
    })
    .join(', ')
}

// Convert a @media condition to a @container condition when it only tests
// width (max-width / min-width). Leaves prefers-color-scheme, orientation,
// height, etc. as @media so they keep checking the correct context.
function toContainerCondition(condition: string): string | null {
  // Strip "only screen and" / "screen and" prefix that emails commonly add
  const stripped = condition
    .replace(/^\s*(?:only\s+)?(?:screen|all)\s+and\s+/i, '')
    .trim()

  // If it references anything other than width, leave it as @media
  if (/\b(?:height|aspect-ratio|orientation|resolution|color(?!-scheme)|monochrome|prefers-|update|overflow|pointer|hover|scan|grid|environment)\b/.test(stripped)) {
    return null
  }

  // Must contain at least one width feature
  if (!/\b(?:max-width|min-width|width)\b/.test(stripped)) {
    return null
  }

  return stripped
}
