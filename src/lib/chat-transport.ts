import { HttpChatTransport, parseJsonEventStream } from 'ai'
import { z } from 'zod'
import { client } from '../client/client.gen'
import { fetchWithAuth } from './auth-fetch'
import type { UIMessageChunk } from 'ai'
import type { ChatFrameEnvelope } from '../client/types.gen'
import type { Ngs360UIMessage } from './chat-protocol'

/**
 * Transport for the AI Assistant chat, and the one place that knows the AI SDK's
 * UI Message Stream protocol.
 *
 * The server streams its own frames — thread, status, text, done, error — and
 * this maps them onto the chunks `useChat` consumes. The direction is
 * deliberate: the SDK is installed here, so the compiler checks the mapping
 * against the real definition. Mirroring the protocol server-side instead meant
 * a field change showed up as a dead stream rather than a failed build.
 *
 * Everything below is SDK knowledge and should stay below. If the server needs
 * to say something new, it adds a frame and this learns to map it.
 */

/**
 * The frames the server sends. Validated, not merely typed — this is JSON off a
 * network stream.
 *
 * The `ChatFrameEnvelope` annotation is load-bearing: that type is generated
 * from the server's Pydantic models, so binding the schema to it makes the
 * compiler catch a rename on either side. Regenerate with
 * `docker exec frontend npm run generate-client`.
 */
const chatFrame: z.ZodType<ChatFrameEnvelope> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('thread'), thread_id: z.string() }),
  z.object({ type: z.literal('status'), tool: z.string() }),
  z.object({ type: z.literal('text'), delta: z.string() }),
  z.object({ type: z.literal('done') }),
  z.object({ type: z.literal('error'), message: z.string() }),
])

type ChatFrame = z.infer<typeof chatFrame>

/** The SDK pairs text-start/delta/end by id. */
const TEXT_PART_ID = 't1'

/** A stable id makes the SDK replace this part rather than append one per call. */
const STATUS_PART_ID = 'status'

/**
 * Reframes one run's frames as SDK chunks. Stateful in two ways the server no
 * longer carries: `start` opens the message once, and `text-end` is owed only if
 * a `text-start` went out — unpaired it is a protocol violation.
 */
function frameMapper() {
  let started = false
  let textOpen = false

  const open = (emit: (chunk: UIMessageChunk) => void) => {
    if (!started) {
      started = true
      emit({ type: 'start' })
    }
  }

  const closeText = (emit: (chunk: UIMessageChunk) => void) => {
    if (textOpen) {
      textOpen = false
      emit({ type: 'text-end', id: TEXT_PART_ID })
    }
  }

  return {
    frame(frame: ChatFrame, emit: (chunk: UIMessageChunk) => void) {
      open(emit)
      switch (frame.type) {
        case 'thread':
          emit({ type: 'data-thread', data: { thread_id: frame.thread_id } })
          return
        case 'status':
          emit({
            type: 'data-status',
            id: STATUS_PART_ID,
            data: { tool_name: frame.tool },
          })
          return
        case 'text':
          if (!textOpen) {
            textOpen = true
            emit({ type: 'text-start', id: TEXT_PART_ID })
          }
          emit({ type: 'text-delta', id: TEXT_PART_ID, delta: frame.delta })
          return
        case 'done':
          closeText(emit)
          emit({ type: 'finish' })
          return
        case 'error':
          closeText(emit)
          emit({ type: 'error', errorText: frame.message })
      }
    },
    /** A dropped connection ends the body without a done or error frame. */
    end(emit: (chunk: UIMessageChunk) => void) {
      closeText(emit)
    },
  }
}

/** Map a whole run's frames to SDK chunks, without needing a stream. */
export function chunksForFrames(frames: Array<ChatFrame>): Array<UIMessageChunk> {
  const mapper = frameMapper()
  const chunks: Array<UIMessageChunk> = []
  const emit = (chunk: UIMessageChunk) => chunks.push(chunk)
  for (const frame of frames) mapper.frame(frame, emit)
  mapper.end(emit)
  return chunks
}

class Ngs360ChatTransport extends HttpChatTransport<Ngs360UIMessage> {
  protected processResponseStream(
    stream: ReadableStream<Uint8Array>,
  ): ReadableStream<UIMessageChunk> {
    const mapper = frameMapper()
    return parseJsonEventStream({ stream, schema: chatFrame }).pipeThrough(
      new TransformStream({
        transform(result, controller) {
          // Server and mapping have diverged; failing loudly beats half a reply.
          if (!result.success) throw result.error
          mapper.frame(result.value, (chunk) => controller.enqueue(chunk))
        },
        flush(controller) {
          mapper.end((chunk) => controller.enqueue(chunk))
        },
      }),
    )
  }
}

/**
 * The AI SDK owns this request's lifecycle, so it can't go through the generated
 * SDK functions — but it uses the same fetchWithAuth and base URL.
 */
export const chatTransport = new Ngs360ChatTransport({
  api: `${String(client.getConfig().baseUrl ?? '').replace(/\/$/, '')}/api/v1/chat/stream`,
  fetch: fetchWithAuth,
})
