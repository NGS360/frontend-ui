import type { CreateClientConfig } from './client/client.gen'

const API_URL = import.meta.env.VITE_API_URL

export const createClientConfig: CreateClientConfig = (config) => {
  const clientConfig = {
    ...config,
    baseURL: API_URL,
  }
  return clientConfig
}
