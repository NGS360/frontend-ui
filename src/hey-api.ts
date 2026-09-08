import type { CreateClientConfig } from './client/client.gen'
import { API_BASE_URL } from '@/lib/api-base'

export const createClientConfig: CreateClientConfig = (config) => {
  const clientConfig = {
    ...config,
    baseUrl: API_BASE_URL,
  }
  return clientConfig
}
