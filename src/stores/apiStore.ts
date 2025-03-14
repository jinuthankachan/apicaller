import { defineStore } from 'pinia'
import axios from 'axios'

interface ApiRequest {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string
  status: 'pending' | 'running' | 'completed' | 'error'
  response?: {
    status: number
    headers: any
    data: any
  }
  error?: any
  duration?: number
}

export const useApiStore = defineStore('api', {
  state: () => ({
    requests: [] as ApiRequest[],
    concurrencyLimit: 3,
    activeRequests: 0,
  }),
  
  actions: {
    addRequest(request: Omit<ApiRequest, 'id' | 'status'>) {
      const id = crypto.randomUUID()
      this.requests.push({
        ...request,
        id,
        status: 'pending'
      })
      this.processQueue()
    },

    async processQueue() {
      const pendingRequests = this.requests.filter(r => r.status === 'pending')
      const availableSlots = this.concurrencyLimit - this.activeRequests

      for (let i = 0; i < Math.min(availableSlots, pendingRequests.length); i++) {
        const request = pendingRequests[i]
        this.executeRequest(request)
      }
    },

    async executeRequest(request: ApiRequest) {
      this.activeRequests++
      const startTime = performance.now()
      
      const index = this.requests.findIndex(r => r.id === request.id)
      if (index === -1) return

      this.requests[index].status = 'running'

      const proxyBaseUrl = 'http://localhost:3000/api'; 
      const originalUrl = new URL(request.url);
      const originalBaseUrl = `${originalUrl.protocol}//${originalUrl.host}`;

      // Replace the base URL with the proxy server's base URL
      const proxiedUrl = request.url.replace(originalBaseUrl, proxyBaseUrl);

      // Set the original base URL in headers to pass to the proxy server
      request.headers['X-Original-Base-Url'] = originalBaseUrl;

      try {
        const response = await axios({
          url: proxiedUrl,
          method: request.method,
          headers: request.headers,
          data: request.body ? JSON.parse(request.body) : undefined
        })

        const endTime = performance.now();
        const duration = endTime - startTime;

        this.requests[index] = {
          ...this.requests[index],
          status: 'completed',
          duration,
          response: {
            status: response.status,
            headers: response.headers,
            data: response.data
          },
        }
        console.log('Response:', this.requests[index].response);
      } catch (error: any) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.requests[index] = {
          ...this.requests[index],
          status: 'error',
          duration,
          error: error.response ? error.response.data : error.message,
        }
        console.error('Error:', this.requests[index].error);
      } finally {
        this.activeRequests--
        this.processQueue()
      }
    },

    setConcurrencyLimit(limit: number) {
      this.concurrencyLimit = limit
      this.processQueue()
    },

    clearRequests() {
      this.requests = []
    }
  }
})
