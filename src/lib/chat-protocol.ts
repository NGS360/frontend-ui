import type {
  DataUIPart,
  InferUIMessageChunk,
  UIMessage,
  UITools,
} from 'ai'

/**
 * The NGS360-specific slots of the chat stream contract. The frame structure is
 * AI SDK protocol and the SDK already types it, so only our own `data-*`
 * payloads are declared here.
 */

/** Payloads of the `data-*` parts, keyed by the name after `data-`. */
export type Ngs360DataParts = {
  thread: { thread_id: string }
  /** The graph's own tool name, opaque; labelled in ai-chat/tool-label.ts. */
  status: { tool_name: string }
  /**
   * Never emitted by the server today, but handled in lib/chat-directives.ts,
   * so the key stays. `destination` is a plain string, not the route union —
   * the model chooses it and zod narrows it before the router sees it.
   */
  navigate: { destination: string; id: string }
}

/**
 * A chat message as this app's stream produces one. METADATA is `never` because
 * nothing reads `message.metadata`; TOOLS stays the SDK default rather than
 * `never`, which would make `addToolResult` uncallable.
 */
export type Ngs360UIMessage = UIMessage<never, Ngs360DataParts, UITools>

/** A `data-*` part as `useChat`'s `onData` receives it. */
export type Ngs360DataUIPart = DataUIPart<Ngs360DataParts>

/** One SSE frame of the stream, as the transport produces it. */
export type Ngs360UIMessageChunk = InferUIMessageChunk<Ngs360UIMessage>
