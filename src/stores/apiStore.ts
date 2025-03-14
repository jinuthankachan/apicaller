import { defineStore } from 'pinia'
import axios from 'axios'

interface ApiRequest {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string
  status: 'pending' | 'running' | 'completed' | 'error'
  response?: any
  error?: string
  duration?: number
}

export const useApiStore = defineStore('api', {
  state: () => ({
    requests: [] as ApiRequest[],
    concurrencyLimit: 3,
    activeRequests: 0,
    response: null, // Add a state variable to store the response
    error: null // Add a state variable to store any errors
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

      const proxyBaseUrl = 'http://localhost:3000/api'; // Proxy server base URL
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

        this.requests[index].response = response.data
        this.requests[index].status = 'completed'
        this.response = response.data; // Store the response data
        this.error = null; // Clear any previous errors
        console.log('Response:', response.data);
      } catch (error: any) {
        this.requests[index].error = error.message
        this.requests[index].status = 'error'
        this.response = null; // Clear any previous response
        this.error = error.response ? error.response.data : error.message; // Store the error message
        console.error('Error:', this.error);
      } finally {
        this.requests[index].duration = performance.now() - startTime
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
