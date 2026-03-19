import { API_BASE_URL, httpClient } from '../../../lib/api'

export const apiStatusApi = {
  baseUrl: API_BASE_URL,
  async checkHealth() {
    return httpClient.get('/health')
  },
}
