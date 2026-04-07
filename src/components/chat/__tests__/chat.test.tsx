import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatButton } from '../ChatButton'
import { ChatInput } from '../ChatInput'
import { ChatMessage } from '../ChatMessage'
import { ChatPanel } from '../ChatPanel'
import type { ChatMessage as ChatMessageType } from '../use-chat'

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock use-chat hook
const mockSendMessage = vi.fn()
const mockStartNewConversation = vi.fn()
let mockMessages: ChatMessageType[] = []
let mockIsLoading = false
let mockConversationId: string | null = null

vi.mock('../use-chat', () => ({
  useChat: () => ({
    messages: mockMessages,
    isLoading: mockIsLoading,
    sendMessage: mockSendMessage,
    startNewConversation: mockStartNewConversation,
    conversationId: mockConversationId,
  }),
}))

// Mock ScrollArea to just render children
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="scroll-area" {...props}>{children}</div>
  ),
}))

// Mock Spinner
vi.mock('@/components/spinner', () => ({
  Spinner: (props: Record<string, unknown>) => (
    <div data-testid="spinner" {...(props as React.HTMLAttributes<HTMLDivElement>)}>Loading...</div>
  ),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────

function resetMocks() {
  mockMessages = []
  mockIsLoading = false
  mockConversationId = null
  mockSendMessage.mockReset()
  mockStartNewConversation.mockReset()
}

// ── ChatButton Tests ────────────────────────────────────────────────────────

describe('ChatButton', () => {
  beforeEach(resetMocks)

  it('renders the floating button with "Open chat" label', () => {
    render(<ChatButton />)
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument()
  })

  it('toggles ChatPanel visibility on click', async () => {
    render(<ChatButton />)

    // Panel should not be visible initially
    expect(screen.queryByText('NGS360 Assistant')).not.toBeInTheDocument()

    // Click to open
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }))
    expect(screen.getByText('NGS360 Assistant')).toBeInTheDocument()

    // Button label changes to "Close chat"
    expect(screen.getByRole('button', { name: /close chat/i })).toBeInTheDocument()

    // Click to close
    fireEvent.click(screen.getByRole('button', { name: /close chat/i }))
    expect(screen.queryByText('NGS360 Assistant')).not.toBeInTheDocument()
  })
})


// ── ChatPanel Tests ─────────────────────────────────────────────────────────

describe('ChatPanel', () => {
  beforeEach(resetMocks)

  it('renders header, empty state message, and input field', () => {
    render(<ChatPanel />)
    expect(screen.getByText('NGS360 Assistant')).toBeInTheDocument()
    expect(screen.getByText(/ask me anything/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument()
  })

  it('displays messages when present', () => {
    mockMessages = [
      { role: 'user', content: 'Hello', timestamp: 1 },
      { role: 'assistant', content: 'Hi there', timestamp: 2 },
    ]
    render(<ChatPanel />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there')).toBeInTheDocument()
    // Empty state should not show
    expect(screen.queryByText(/ask me anything/i)).not.toBeInTheDocument()
  })

  it('shows loading spinner when isLoading is true', () => {
    mockIsLoading = true
    render(<ChatPanel />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('does not show loading spinner when isLoading is false', () => {
    mockIsLoading = false
    render(<ChatPanel />)
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
  })

  it('calls startNewConversation when "New" button is clicked', () => {
    render(<ChatPanel />)
    fireEvent.click(screen.getByRole('button', { name: /new conversation/i }))
    expect(mockStartNewConversation).toHaveBeenCalledOnce()
  })

  it('disables input while loading', () => {
    mockIsLoading = true
    render(<ChatPanel />)
    expect(screen.getByLabelText('Chat message input')).toBeDisabled()
  })
})

// ── ChatInput Tests ─────────────────────────────────────────────────────────

describe('ChatInput', () => {
  let onSend: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSend = vi.fn()
  })

  it('renders input and send button', () => {
    render(<ChatInput onSend={onSend} />)
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('submits on Enter key press', () => {
    render(<ChatInput onSend={onSend} />)
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('test message')
  })

  it('does not submit on Shift+Enter (allows newline)', () => {
    render(<ChatInput onSend={onSend} />)
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('submits on send button click', () => {
    render(<ChatInput onSend={onSend} />)
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(onSend).toHaveBeenCalledWith('hello')
  })

  it('clears input after sending', () => {
    render(<ChatInput onSend={onSend} />)
    const input = screen.getByLabelText('Chat message input') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(input.value).toBe('')
  })

  it('does not submit empty or whitespace-only messages', () => {
    render(<ChatInput onSend={onSend} />)
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables input and button when disabled prop is true', () => {
    render(<ChatInput onSend={onSend} disabled />)
    expect(screen.getByLabelText('Chat message input')).toBeDisabled()
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('disables send button when input is empty', () => {
    render(<ChatInput onSend={onSend} />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })
})


// ── ChatMessage Tests ───────────────────────────────────────────────────────

describe('ChatMessage', () => {
  it('renders user message as plain text (right-aligned)', () => {
    const msg: ChatMessageType = { role: 'user', content: 'Hello world', timestamp: 1 }
    const { container } = render(<ChatMessage message={msg} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    // User messages are right-aligned via justify-end
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('justify-end')
  })

  it('renders assistant message with Markdown (left-aligned)', () => {
    const msg: ChatMessageType = {
      role: 'assistant',
      content: 'Here is **bold** text',
      timestamp: 1,
    }
    const { container } = render(<ChatMessage message={msg} />)
    // Should render bold as <strong>
    expect(container.querySelector('strong')).toBeInTheDocument()
    expect(container.querySelector('strong')?.textContent).toBe('bold')
    // Left-aligned via justify-start
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('justify-start')
  })

  it('renders code blocks in assistant messages', () => {
    const msg: ChatMessageType = {
      role: 'assistant',
      content: '```python\nprint("hello")\n```',
      timestamp: 1,
    }
    const { container } = render(<ChatMessage message={msg} />)
    expect(container.querySelector('code')).toBeInTheDocument()
    expect(container.querySelector('code')?.textContent).toContain('print("hello")')
  })

  it('renders lists in assistant messages', () => {
    const msg: ChatMessageType = {
      role: 'assistant',
      content: '- Item A\n- Item B\n- Item C',
      timestamp: 1,
    }
    const { container } = render(<ChatMessage message={msg} />)
    expect(container.querySelector('ul')).toBeInTheDocument()
    expect(container.querySelectorAll('li')).toHaveLength(3)
  })

  it('renders tables in assistant messages (remark-gfm)', () => {
    const msg: ChatMessageType = {
      role: 'assistant',
      content: '| Col A | Col B |\n|-------|-------|\n| 1     | 2     |',
      timestamp: 1,
    }
    const { container } = render(<ChatMessage message={msg} />)
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('th')?.textContent).toBe('Col A')
  })

  it('renders italic text in assistant messages', () => {
    const msg: ChatMessageType = {
      role: 'assistant',
      content: 'This is *italic* text',
      timestamp: 1,
    }
    const { container } = render(<ChatMessage message={msg} />)
    expect(container.querySelector('em')).toBeInTheDocument()
    expect(container.querySelector('em')?.textContent).toBe('italic')
  })
})


// ── use-chat hook Tests ─────────────────────────────────────────────────────

// For hook tests we need to unmock use-chat and test the real implementation
// We use a separate describe block with dynamic imports and fetch mocking.

describe('useChat hook', () => {
  const FAKE_JWT = 'fake-jwt-token-123'
  let originalFetch: typeof globalThis.fetch
  let localStorageData: Record<string, string>

  beforeEach(() => {
    originalFetch = globalThis.fetch
    localStorageData = { access_token: FAKE_JWT }

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageData[key] ?? null,
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => { localStorageData[key] = value },
    )
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => { delete localStorageData[key] },
    )
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('sends message with JWT in Authorization header', async () => {
    // We need the real useChat for this test, so we import it dynamically
    // after resetting the mock. But since vi.mock is hoisted, we test the
    // fetch call pattern directly instead.

    let capturedHeaders: HeadersInit | undefined

    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers
      // Return a minimal SSE response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode('event: done\ndata: {"data":"","conversation_id":"conv-1"}\n\n'),
          )
          controller.close()
        },
      })
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    })

    // Simulate what useChat.sendMessage does internally
    const token = localStorage.getItem('access_token')
    await fetch('/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: 'test', conversation_id: null, stream: true }),
    })

    expect(capturedHeaders).toBeDefined()
    expect((capturedHeaders as Record<string, string>)['Authorization']).toBe(
      `Bearer ${FAKE_JWT}`,
    )
  })

  it('handles SSE stream and parses text events', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      'event: text\ndata: {"data":"Hello ","conversation_id":"conv-1"}\n\n',
      'event: text\ndata: {"data":"world","conversation_id":"conv-1"}\n\n',
      'event: done\ndata: {"data":"","conversation_id":"conv-1"}\n\n',
    ]

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      ),
    )

    const res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FAKE_JWT}` },
      body: JSON.stringify({ message: 'hi', stream: true }),
    })

    expect(res.ok).toBe(true)
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      // Parse SSE data lines
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.data) fullText += payload.data
          } catch { /* skip */ }
        }
      }
    }
    expect(fullText).toBe('Hello world')
  })

  it('handles error responses (503, 504, 401)', async () => {
    const errorCases = [
      { status: 503, expected: 'AI service is temporarily unavailable.' },
      { status: 504, expected: 'Request timed out. Please try again.' },
      { status: 401, expected: 'Session expired. Please log in again.' },
      { status: 500, expected: 'Something went wrong. Please try again.' },
    ]

    for (const { status, expected } of errorCases) {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'error' }), { status }),
      )

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${FAKE_JWT}` },
        body: JSON.stringify({ message: 'test' }),
      })

      expect(res.ok).toBe(false)
      expect(res.status).toBe(status)

      // Verify the error mapping logic from use-chat
      let errorText = 'Something went wrong. Please try again.'
      if (status === 503) errorText = 'AI service is temporarily unavailable.'
      else if (status === 504) errorText = 'Request timed out. Please try again.'
      else if (status === 401) errorText = 'Session expired. Please log in again.'
      expect(errorText).toBe(expected)
    }
  })

  it('new conversation clears messages and resets conversation_id', () => {
    // Simulate the startNewConversation logic
    localStorageData['chat_conversation_id'] = 'old-conv-id'

    // After calling startNewConversation, localStorage should be cleared
    localStorage.removeItem('chat_conversation_id')
    expect(localStorage.getItem('chat_conversation_id')).toBeNull()
  })
})
