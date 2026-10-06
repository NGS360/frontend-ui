// Single source of truth for the NGS360 wordmark colors.
// Each entry pairs a letter/digit of "NGS360" with its brand color, in order.
// Consumed by the logo (ngs360-logo.tsx) and the animated AI Assistant icon (Header.tsx).
export const NGS360_LETTERS = [
  ['N', '#9de073'], // green
  ['G', '#68706e'], // gray
  ['S', '#25aedd'], // blue
  ['3', '#eb6341'], // red/orange
  ['6', '#ffc180'], // peach
  ['0', '#9de073'], // green
] as const

// Just the colors, in NGS360 order (N, G, S, 3, 6, 0).
export const NGS360_LETTER_COLORS = NGS360_LETTERS.map(([, color]) => color)
