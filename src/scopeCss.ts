const SCOPE = 'ep'

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
    scopedCss ? `<style>${scopedCss}</style>` : '',
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
    // Block @import — could load external CSS that defeats scoping
    return ''
  }
  if (rule instanceof CSSStyleRule) {
    return `${scopeSelector(rule.selectorText)} { ${rule.style.cssText} }`
  }
  if (rule instanceof CSSMediaRule) {
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
      // These target the document root — map to our scope wrapper
      if (/^(?:html|body|:root)$/.test(s)) return `.${SCOPE}`
      // These descend from html/body — strip the top element, keep the rest
      const m = s.match(/^(?:html|body)\s*[>+~\s](.+)/)
      if (m) return `.${SCOPE} ${m[1].trim()}`
      return `.${SCOPE} ${s}`
    })
    .join(', ')
}
