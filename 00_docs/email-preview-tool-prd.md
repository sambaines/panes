# PRD: Email Source Preview Tool

## 1. Summary

A lightweight, client-side web app for previewing raw email source (`.eml` files or pasted MIME/HTML source) at desktop and mobile widths simultaneously, in a clean UI suitable for capturing with the Figma Chrome extension. No backend, no accounts, no email provider integration — the user manually exports source from their email client (e.g. Gmail's "Show original") and drops it into the tool.

## 2. Problem Statement

Gmail's web UI sanitizes and rewrites email HTML before rendering it (strips `<style>` blocks, inlines CSS, rewrites classes, proxies images, drops unsupported CSS properties). This makes it unreliable for design QA — what's on screen is "Gmail's interpretation," not the original email. The raw source (via "Show original" / `.eml` export) contains the true, unmodified HTML the sender authored. This tool renders that true source directly, at fixed desktop and mobile widths, so it can be visually inspected and captured into Figma for design review.

## 3. Goals

- Accurately render the original HTML email exactly as authored, without any client-side reinterpretation.
- Display desktop and mobile viewports side-by-side in a single window for easy comparison and capture.
- Support both `.eml` file drag-and-drop and pasted raw source text.
- Provide a distraction-free "capture mode" that hides all tool chrome, leaving only the two rendered frames for a clean capture with the Figma Chrome extension.
- Run identically as a local static site or deployed to Netlify, with zero backend.

## 4. Non-Goals

- No Gmail API integration, OAuth, or automatic fetching of emails (explicitly out of scope for this version).
- No content script / browser extension — this is a standalone web app.
- No editing of email HTML, no email sending/forwarding, no inbox/list view.
- No server-side rendering or storage of any kind — everything happens in-browser, in memory.
- No support for `.msg` (Outlook binary format) in v1 — MIME/`.eml` and pasted raw source only.
- No manual light/dark toggle — the email's `prefers-color-scheme` CSS (if any) is left to resolve naturally against the visitor's actual macOS/browser appearance setting. Note this only reflects clients that honor that CSS (e.g. Apple Mail); it doesn't replicate Gmail's or Outlook's own automatic dark-mode inversion, which no browser preview can reproduce.

## 5. User Stories

- As a designer, I want to drop an `.eml` file onto a page and immediately see the email rendered at both desktop and mobile widths, so I can compare layouts without opening two separate tools.
- As a designer, I want inline images (logos, embedded signature images) to render correctly rather than showing as broken images, so my Figma capture looks correct.
- As a designer, I want to hide all UI chrome before capturing, so the Figma extension only picks up the two clean rendered frames.
- As a designer, I want to paste raw MIME/HTML source directly (without saving a file first) as a faster alternative to drag-and-drop.
- As a user, I want this to work with no install and no login — just a URL (or a local folder I can run myself).

## 6. Key Technical Risk — Validate Before Building

The target capture tool is the [Figma Chrome extension](https://www.figma.com/downloads/chrome-extension/) ("Capture page" / "Select element"). Per Figma's own documentation, this does **not** take a pixel screenshot — it walks the page's live DOM and converts elements into editable Figma layers (frames, text, images, shapes). It requires a paid Figma plan, and Figma notes that non-standard rendering (heavy JS, `<canvas>`) can "capture imperfectly."

This has a direct consequence for our architecture: an `<iframe>` (especially with `sandbox`/`srcdoc`) renders its content in a **separate nested document**. Whether a DOM-walking capture tool like this reaches inside that nested document depends on how its content script is injected (e.g. whether it targets `all_frames`) — this is not documented publicly, so it cannot be assumed either way.

**Required first step:** before building the full app, run a minimal spike — one hard-coded HTML snippet rendered inside a sandboxed `iframe.srcdoc` — and confirm with the actual Figma extension whether "Capture page" picks up the iframe's contents or only an empty box. This single test determines which rendering approach below (7.3) to build.

- **If iframe capture works:** proceed with the sandboxed iframe approach as originally planned (safer: blocks script execution, prevents style leakage both directions).
- **If iframe capture fails:** fall back to rendering the parsed email HTML directly into the top-level document (no nested browsing context), using CSS scoping (e.g. a wrapping container with a unique class and a CSS reset scoped to that class, or a `shadow DOM` root if Figma's extension is confirmed to pierce open shadow roots — verify this in the same spike) instead of `sandbox`. In this fallback, any `<script>` tags in the source **must** be stripped during parsing (belt-and-braces, since we should strip them regardless — see 7.2), since there's no sandbox to rely on for script isolation.

## 7. Functional Requirements

### 7.1 Input
- **Drag-and-drop zone** accepting `.eml` files.
- **Paste input** (textarea or paste-anywhere) accepting raw MIME source or raw HTML directly.
- Basic validation: detect whether input is a full MIME message (has headers/multipart structure) vs. bare HTML, and handle both.
- Clear error state if the file/paste can't be parsed (e.g. "Couldn't find an HTML part in this message").

### 7.2 Parsing
- Parse MIME structure to extract the `text/html` part of the message.
- Decode `Content-Transfer-Encoding` correctly (`quoted-printable`, `base64`, or none).
- Extract inline (`Content-ID`) image parts and resolve `cid:` references in the HTML into `data:` URIs so embedded images render correctly.
- Leave remote (`http`/`https`) image URLs untouched — these load normally from the sender's server.
- Strip any `<script>` tags from the parsed HTML regardless of the rendering approach chosen in section 6 (defense in depth).
- Use an existing, well-tested MIME parsing library rather than a hand-rolled parser (e.g. `postal-mime` or `emailjs-mime-parser`).

### 7.3 Rendering
- Render the parsed HTML into **two side-by-side panes**:
  - **Desktop pane**: fixed width (default 1440px — configurable, see 7.4).
  - **Mobile pane**: fixed width (default 375px — configurable, see 7.4).
- Rendering mechanism (iframe vs. top-level DOM + CSS scoping) is determined by the spike outcome in section 6 — do not default to iframe without validating capture compatibility first.
- If the iframe approach is used: `srcdoc` (not `src`, to avoid needing a data URL or blob URL) with the `sandbox` attribute, to prevent any embedded `<script>` from executing and to prevent the email's styles from leaking into the app's own UI.
- Each pane auto-sizes its height to fit the rendered content (no internal scrollbars) so a full-length email is fully visible/capturable.

### 7.4 Controls
- Toggle or numeric input to adjust desktop/mobile pane widths (common presets: 1440/1280/1024 for desktop; 375/390/414 for mobile).
- **"Capture mode" toggle**: hides the input zone, controls, and any other chrome, leaving only the two rendered panes on a plain background — this is the state the user will be in when running the Figma extension's "Capture page."
- "Load another email" / reset action to clear current state and return to the input zone.

### 7.5 Output
- No export/download feature required in v1 — the sole output path is visual, via the user's own Figma Chrome extension against the rendered panes.

## 8. Technical Requirements

### 8.1 Architecture
- 100% static, client-side single-page app. No backend, no server-side functions, no database.
- All parsing and rendering happens in the browser using standard Web APIs (`File`, `FileReader`, `DOMParser`) plus the bundled MIME parsing library.

### 8.2 Tech Stack
- **Build tool:** Vite
- **Package manager:** **Yarn** (not npm) — use `yarn install`, `yarn dev`, `yarn build` for all setup, scripts, and documentation. `package-lock.json` should not be present; commit `yarn.lock`.
- **Framework:** Plain JS/TypeScript or a minimal framework (React is fine given familiarity from prior discussion, but not required — either is acceptable given the app's small surface area).
- **MIME parsing library:** `postal-mime` (preferred) or `emailjs-mime-parser` — evaluate both for bundle size and browser-compatibility, pick one.
- **Styling:** simple CSS (no heavy design system needed) — the app's own UI is secondary to the rendered email panes.

### 8.3 Deployment
- **Local:** `yarn install && yarn dev` for development; `yarn build` produces a static `dist/` folder that can also be opened/served directly (e.g. `npx serve dist`, or any static file server).
- **Netlify:** deploy the same `dist/` output. Build command `yarn build`, publish directory `dist`. No environment variables, functions, or redirects required for v1.

### 8.4 Browser Support
- Target latest Chrome (required, since the Figma capture workflow depends on a Chrome extension) — Edge/Firefox/Safari support is a bonus for local viewing but not required for the capture workflow.

## 9. UI/UX Notes

- Default view: input zone (drag-and-drop + paste option) with brief instructions (e.g. "Drop a .eml file, or paste raw email source").
- Once an email is loaded: two panes shown side-by-side (desktop | mobile), with pane-width controls and capture-mode toggle above them.
- Capture mode: single click hides all controls; panes remain, ideally on a neutral/white background with clear visual separation between the two panes (or optionally none, if the user wants both in a single seamless capture — configurable).
- Keep the whole app visually minimal — it's a utility, not a branded product.

## 6a. Spike Outcome (Resolved 2026-07-03)

The spike (`spike-iframe-capture.html`) was run against the Figma Chrome extension "Capture page" feature. Result: **iframe capture failed** — the extension did not capture content inside a sandboxed `iframe.srcdoc`; it returned an empty box. The top-level DOM reference block (Test B) captured correctly, confirming the extension itself was working.

**Architectural decision:** The app will use **top-level DOM rendering with CSS scoping** — no iframes. Specifically:

- Email HTML is injected into a wrapper `div` in the main page DOM.
- All `<script>` tags are stripped from the parsed email source (no sandbox to rely on — this is mandatory).
- CSS scoping is achieved via a unique wrapper class plus a CSS reset scoped to that class, preventing the email's styles from bleeding into the app UI and vice versa.
- Two wrapper divs are rendered side by side, each constrained to its viewport width (800px desktop / 375px mobile), with `overflow: hidden` on the outer container and the inner content at full natural height (no internal scrollbars).
- Shadow DOM was not tested for Figma extension compatibility; given that iframes already failed, plain CSS scoping is the safer choice.

## 10. Open Questions

- ~~Section 6 spike outcome: does the Figma extension capture content inside a sandboxed iframe, or does it require top-level DOM rendering?~~ **Resolved — see section 6a. Top-level DOM required.**
- Should desktop/mobile widths be user-configurable per session only, or persisted (e.g. via `localStorage`) between visits?
- Should the tool support loading multiple emails in sequence within one session (history/tabs), or is single-email-at-a-time sufficient for v1?
- Is a "hide sender images / show placeholder" toggle needed for privacy (some emails use tracking pixels), or is that out of scope since this is a personal/internal tool?
- Should there be a subtle visual label under each pane (e.g. "Desktop — 1440px" / "Mobile — 375px") to aid orientation in Figma, and should that label be excluded from capture mode?
- Does the user's Figma plan support the extension's capture feature (currently paid-plan-only per Figma's docs)? Worth confirming before relying on this workflow.

## 11. Out of Scope for v1 (Future Considerations)

- Gmail API / OAuth integration for direct email fetching (previously discussed, deliberately deferred).
- Browser extension packaging.
- `.msg` file support.
- Export to PNG/PDF directly from the tool (relying on the Figma extension instead).
- Multi-email comparison or batch processing.
- Forced light/dark mode toggle independent of system preference (considered and deliberately dropped — see Non-Goals).

## 12. Success Criteria

- A `.eml` file exported from Gmail via "Show original" renders accurately (matching the original HTML/CSS, with inline images intact) in both panes.
- The Figma Chrome extension successfully captures both panes as editable layers in "Capture page" mode, confirmed via the section 6 spike before full build-out.
- The app runs locally via `yarn dev` with no configuration.
- The same codebase deploys to Netlify successfully with `yarn build` and no backend dependencies.
- Capture mode produces a clean, chrome-free view suitable for direct use with the Figma extension.
