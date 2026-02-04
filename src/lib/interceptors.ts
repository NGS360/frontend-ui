import { client } from "../client/client.gen";

const api = client.instance;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
});