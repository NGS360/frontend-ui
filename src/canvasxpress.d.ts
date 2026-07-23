/** CanvasXpress data object - `y` holds the matrix, `x` the sample annotations */
export interface CanvasXpressData {
  y: {
    vars: Array<string>
    smps: Array<string>
    data: Array<Array<number>>
  }
  x?: Record<string, Array<string | number>>
  z?: Record<string, Array<string | number>>
}

/** CanvasXpress accepts a large, open ended set of rendering options */
export type CanvasXpressConfig = Record<string, unknown>

/** Subset of the CanvasXpress instance API this app uses */
export interface CanvasXpressGraph {
  setDimensions: (width: number, height: number) => void
  updateData: (data: CanvasXpressData) => void
  updateConfig: (config: CanvasXpressConfig) => void
  destroy: () => void
}

export interface CanvasXpressConstructor {
  /**
   * Renders the chart into the canvas with the given id. The returned value carries
   * none of the instance API - reach for `getObject` once rendering has finished.
   */
  new (
    target: string,
    data: CanvasXpressData,
    config?: CanvasXpressConfig,
    events?: Record<string, unknown>
  ): unknown

  /** Instances register asynchronously, so this is undefined until the first render lands */
  getObject: (target: string) => CanvasXpressGraph | undefined

  /** Tears down the chart and removes the wrapper DOM it built around the canvas */
  destroy: (target: string) => void
}

declare global {
  interface Window {
    CanvasXpress?: CanvasXpressConstructor
  }
}
