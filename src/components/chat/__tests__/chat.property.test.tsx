// Feature: ngs360-ai-chatbot, Property 10: Markdown rendering preserves structure
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { ChatMessage } from '../ChatMessage'
import type { ChatMessage as ChatMessageType } from '../use-chat'

/**
 * Property 10: Markdown rendering preserves structure
 *
 * For any agent response string containing Markdown elements
 * (code blocks, lists, tables, bold, italic), the ChatMessage
 * renderer SHALL produce HTML containing the corresponding
 * semantic elements (<code>, <ul>/<ol>, <table>, <strong>, <em>).
 *
 * Validates: Requirements 5.7
 */

function renderAssistant(content: string) {
  const msg: ChatMessageType = { role: 'assistant', content, timestamp: 1 }
  const { container } = render(<ChatMessage message={msg} />)
  return container
}

// Arbitrary for non-empty words safe for markdown inline use.
// Must not start/end with spaces (markdown emphasis requires non-space adjacent to delimiters).
const safeWord = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9 ]{0,28}[a-zA-Z0-9]$|^[a-zA-Z0-9]$/)

describe('Property 10: Markdown rendering preserves structure', () => {
  it('bold text always renders as <strong>', () => {
    fc.assert(
      fc.property(safeWord, (word) => {
        const container = renderAssistant(`This is **${word}** text`)
        const strong = container.querySelector('strong')
        expect(strong).not.toBeNull()
        expect(strong!.textContent).toBe(word)
      }),
      { numRuns: 100 },
    )
  })

  it('italic text always renders as <em>', () => {
    fc.assert(
      fc.property(safeWord, (word) => {
        const container = renderAssistant(`This is *${word}* text`)
        const em = container.querySelector('em')
        expect(em).not.toBeNull()
        expect(em!.textContent).toBe(word)
      }),
      { numRuns: 100 },
    )
  })

  it('inline code always renders as <code>', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => !s.includes('`') && !s.includes('\n')),
        (code) => {
          const container = renderAssistant(`Use \`${code}\` here`)
          const codeEl = container.querySelector('code')
          expect(codeEl).not.toBeNull()
          expect(codeEl!.textContent).toBe(code)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('fenced code blocks always render as <code> inside <pre>', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }).filter((s) => !s.includes('`') && !s.includes('\n')),
        (code) => {
          const md = `\`\`\`\n${code}\n\`\`\``
          const container = renderAssistant(md)
          expect(container.querySelector('pre')).not.toBeNull()
          expect(container.querySelector('code')).not.toBeNull()
          // react-markdown may append a trailing newline inside <code>
          expect(container.querySelector('code')!.textContent!.trim()).toBe(code.trim())
        },
      ),
      { numRuns: 100 },
    )
  })

  it('unordered lists always render as <ul> with <li> items', () => {
    fc.assert(
      fc.property(
        fc.array(safeWord, { minLength: 1, maxLength: 6 }),
        (items) => {
          const md = items.map((item) => `- ${item}`).join('\n')
          const container = renderAssistant(md)
          expect(container.querySelector('ul')).not.toBeNull()
          expect(container.querySelectorAll('li').length).toBe(items.length)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('ordered lists always render as <ol> with <li> items', () => {
    fc.assert(
      fc.property(
        fc.array(safeWord, { minLength: 1, maxLength: 6 }),
        (items) => {
          const md = items.map((item, i) => `${i + 1}. ${item}`).join('\n')
          const container = renderAssistant(md)
          expect(container.querySelector('ol')).not.toBeNull()
          expect(container.querySelectorAll('li').length).toBe(items.length)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('GFM tables always render as <table> with correct structure', () => {
    fc.assert(
      fc.property(
        fc.array(safeWord, { minLength: 2, maxLength: 4 }),
        fc.array(
          fc.array(safeWord, { minLength: 2, maxLength: 4 }),
          { minLength: 1, maxLength: 4 },
        ),
        (headers, rows) => {
          const colCount = headers.length
          const normalizedRows = rows.map((row) => {
            const padded = [...row]
            while (padded.length < colCount) padded.push('x')
            return padded.slice(0, colCount)
          })

          const headerLine = `| ${headers.join(' | ')} |`
          const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`
          const dataLines = normalizedRows.map((row) => `| ${row.join(' | ')} |`)
          const md = [headerLine, separatorLine, ...dataLines].join('\n')

          const container = renderAssistant(md)
          expect(container.querySelector('table')).not.toBeNull()
          expect(container.querySelectorAll('th').length).toBe(colCount)
          // header row + data rows
          expect(container.querySelectorAll('tr').length).toBe(normalizedRows.length + 1)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('mixed markdown preserves all semantic elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          bold: safeWord,
          italic: safeWord,
          code: fc.string({ minLength: 1, maxLength: 15 }).filter((s) => !s.includes('`') && !s.includes('\n')),
        }),
        ({ bold, italic, code }) => {
          const md = [
            `Here is **${bold}** and *${italic}* and \`${code}\``,
            '',
            '- item one',
            '- item two',
          ].join('\n')

          const container = renderAssistant(md)
          expect(container.querySelector('strong')).not.toBeNull()
          expect(container.querySelector('em')).not.toBeNull()
          expect(container.querySelector('code')).not.toBeNull()
          expect(container.querySelector('ul')).not.toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })
})
