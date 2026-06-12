import { DefaultChatTransport } from 'ai'
import { client } from '../client/client.gen'
import { fetchWithAuth } from './auth-fetch'

/**
 * Transport for the AI Assistant chat. The endpoint streams the Vercel AI SDK
 * UI Message Stream Protocol — see APIServer/api/chat/routes.py for the server
 * half of the contract.
 *
 * The AI SDK owns this request's lifecycle (UIMessage body, chunk parsing,
 * abort), so it can't go through the generated SDK functions — but it uses
 * the same fetchWithAuth and base URL as the generated client.
 */
export const chatTransport = new DefaultChatTransport({
  api: `${String(client.getConfig().baseUrl ?? '').replace(/\/$/, '')}/api/v1/chat`,
  fetch: fetchWithAuth,
})
