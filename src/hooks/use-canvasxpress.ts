import { useEffect, useState } from 'react'
import canvasXpressUrl from 'canvasxpress/src/canvasXpress.js?url'
import 'canvasxpress/src/canvasXpress.css'
import type { CanvasXpressConstructor } from '@/canvasxpress'

/**
 * canvasXpress.js contains `delete (c)` on a local variable, which is a syntax error
 * under strict mode, so the library cannot be bundled into the ES module graph. Load
 * it as a classic script instead - those run sloppy mode - and read it off `window`.
 */
let pending: Promise<CanvasXpressConstructor> | undefined

const loadCanvasXpress = (): Promise<CanvasXpressConstructor> => {
  if (pending) return pending

  pending = new Promise((resolve, reject) => {
    if (window.CanvasXpress) {
      resolve(window.CanvasXpress)
      return
    }

    const script = document.createElement('script')
    script.src = canvasXpressUrl
    script.async = true
    script.onload = () => {
      if (window.CanvasXpress) resolve(window.CanvasXpress)
      else reject(new Error('CanvasXpress loaded but did not register a global'))
    }
    script.onerror = () => reject(new Error('Failed to load CanvasXpress'))
    document.head.appendChild(script)
  })

  return pending
}

/** Returns the CanvasXpress constructor once the library has loaded */
export const useCanvasXpress = (): CanvasXpressConstructor | undefined => {
  const [constructor, setConstructor] = useState<CanvasXpressConstructor>()

  useEffect(() => {
    let active = true
    loadCanvasXpress()
      .then((cx) => {
        // Wrap in a thunk so React does not treat the constructor as a state updater
        if (active) setConstructor(() => cx)
      })
      .catch((error: unknown) => console.error(error))

    return () => { active = false }
  }, [])

  return constructor
}
