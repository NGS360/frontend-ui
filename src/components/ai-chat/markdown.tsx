import { useEffect, useMemo, useState } from 'react'
import { Streamdown } from 'streamdown'
import type {
  Components,
  ControlsConfig,
  LinkSafetyConfig,
  PluginConfig,
  UrlTransform,
} from 'streamdown'

/**
 * Assistant markdown for the AI chat sidebar.
 *
 * Streamdown compares object-valued props by reference, so they all live at
 * module scope; an inline literal would defeat its per-block memo and re-parse
 * every message on each stream flush.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

const sameOrigin = (url: string) => {
  try {
    return new URL(url, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

// Sanitization already blocks javascript: hrefs; this also covers data:/blob:
// and is one function a test can pin.
const urlTransform: UrlTransform = (url) => {
  if (!url) return null
  if (/^[/#?]/.test(url)) return url
  try {
    return SAFE_PROTOCOLS.has(new URL(url, window.location.href).protocol)
      ? url
      : null
  } catch {
    return null
  }
}

// Internal links open directly; off-origin keeps Streamdown's confirm modal,
// because the href came from the model and a plausible link is a phishing lure.
const linkSafety: LinkSafetyConfig = {
  enabled: true,
  onLinkCheck: (url) => sameOrigin(url),
}

// Model output never causes a network fetch. rehype-harden allows any image
// origin by default, making <img> a zero-click GET that can exfiltrate
// whatever the agent read.
const components: Components = {
  img: ({ alt }) => (
    <span className="text-xs italic text-muted-foreground">
      {alt ? `[image: ${alt}]` : '[image omitted]'}
    </span>
  ),
}

// Copy is useful for a SQL reply; download-as-file is not, in a chat.
const controls: ControlsConfig = {
  code: { copy: true, download: false },
  table: true,
}

export function AiChatMarkdown({
  isStreaming,
  text,
}: {
  /** True only for the trailing assistant message while it streams. Marks the
   *  last block incomplete, so a half-arrived fence renders as pending. */
  isStreaming: boolean
  text: string
}) {
  // Shiki off the critical path: this chunk loads on every authenticated page.
  const [code, setCode] = useState<PluginConfig['code']>()
  useEffect(() => {
    void import('@streamdown/code').then((m) => setCode(m.code))
  }, [])
  const plugins = useMemo(() => (code ? { code } : undefined), [code])

  return (
    <Streamdown
      caret="block"
      className="ai-chat-markdown"
      components={components}
      controls={controls}
      isAnimating={isStreaming}
      linkSafety={linkSafety}
      // Line numbers eat scarce width in a 240–384px column.
      lineNumbers={false}
      plugins={plugins}
      urlTransform={urlTransform}
    >
      {text}
    </Streamdown>
  )
}
