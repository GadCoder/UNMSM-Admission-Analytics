import axios from 'axios'

import { API_BASE_URL } from './env'

let adminAccessToken: string | null = null

export function setAdminAccessToken(token: string | null) {
  adminAccessToken = token
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

httpClient.interceptors.request.use((config) => {
  if (adminAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${adminAccessToken}`
  }
  return config
})
