import { client } from '../client/client.gen'
import { ApiError } from './api-error'
import { fetchWithAuth } from './auth-fetch'

// All generated-SDK requests go out through fetchWithAuth, which attaches the
// Bearer token and handles 401 → single-flight refresh → retry. The same
// function backs the AI chat transport, so the whole app shares one auth path.
client.setConfig({ fetch: fetchWithAuth })

// Non-2xx responses: the fetch client parses the error body and throws it.
// Wrap it into ApiError so error handling (lib/error-utils.ts) receives the
// status code and request context alongside the parsed body.
client.interceptors.error.use(
  (error, response, request) =>
    new ApiError(
      response.status,
      response.statusText,
      error,
      request.method,
      request.url,
    ),
)
