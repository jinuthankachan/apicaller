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
    activeRequests: 0
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

      try {
        const response = await axios({
          url: request.url,
          method: request.method,
          headers: request.headers,
          data: request.body ? JSON.parse(request.body) : undefined
        })

        this.requests[index].response = response.data
        this.requests[index].status = 'completed'
      } catch (error: any) {
        this.requests[index].error = error.message
        this.requests[index].status = 'error'
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
