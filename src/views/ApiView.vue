<template>
  <div class="api-view">
    <el-form @submit.prevent="handleSubmit" :model="form" label-width="120px">
      <el-form-item label="URL">
        <el-input v-model="form.url" placeholder="Enter API URL" />
      </el-form-item>
      
      <el-form-item label="Method">
        <el-select v-model="form.method">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
        </el-select>
      </el-form-item>

      <el-form-item label="Headers">
        <div v-for="(_, index) in headerRows" :key="index" class="header-row">
          <el-input v-model="headerKeys[index]" placeholder="Key" style="width: 200px; margin-right: 10px" />
          <el-input v-model="headerValues[index]" placeholder="Value" style="width: 200px; margin-right: 10px" />
          <el-button @click="removeHeader(index)" type="danger" circle>
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button @click="addHeader" type="primary" plain>Add Header</el-button>
      </el-form-item>

      <el-form-item label="Body" v-if="form.method !== 'GET'">
        <el-input
          v-model="form.body"
          type="textarea"
          :rows="4"
          placeholder="Enter JSON body"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" native-type="submit">Send Request</el-button>
        <el-button @click="clearRequests">Clear History</el-button>
      </el-form-item>
    </el-form>

    <div class="concurrency-control">
      <span>Concurrent Requests: </span>
      <el-input-number 
        v-model="concurrencyLimit" 
        :min="1" 
        :max="10"
        @change="updateConcurrencyLimit"
      />
    </div>

    <div class="requests-list">
      <h2>Request History</h2>
      <el-timeline>
        <el-timeline-item
          v-for="request in requests"
          :key="request.id"
          :type="getStatusType(request.status)"
          :timestamp="getTimestamp(request)"
        >
          <el-card>
            <template #header>
              <div class="request-header">
                <el-tag>{{ request.method }}</el-tag>
                <span class="url">{{ request.url }}</span>
                <el-tag :type="getStatusTag(request.status)">
                  {{ request.status.toUpperCase() }}
                </el-tag>
              </div>
            </template>
            
            <div v-if="request.status === 'completed'" class="response">
              <strong>Response:</strong>
              <pre>{{ JSON.stringify(request.response, null, 2) }}</pre>
            </div>
            
            <div v-if="request.status === 'error'" class="error">
              <strong>Error:</strong> {{ request.error }}
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApiStore } from '@/stores/apiStore'
import { Delete } from '@element-plus/icons-vue'

const apiStore = useApiStore()

interface FormData {
  url: string
  method: string
  body: string
}

const form = ref<FormData>({
  url: '',
  method: 'GET',
  body: ''
})

const headerRows = ref([1])
const headerKeys = ref([''])
const headerValues = ref([''])

const concurrencyLimit = ref(3)

const requests = computed(() => apiStore.requests)

function addHeader() {
  headerRows.value.push(1)
  headerKeys.value.push('')
  headerValues.value.push('')
}

function removeHeader(index: number) {
  headerRows.value.splice(index, 1)
  headerKeys.value.splice(index, 1)
  headerValues.value.splice(index, 1)
}

function handleSubmit() {
  const headers: Record<string, string> = {}
  headerKeys.value.forEach((key, index) => {
    if (key && headerValues.value[index]) {
      headers[key] = headerValues.value[index]
    }
  })

  apiStore.addRequest({
    url: form.value.url,
    method: form.value.method,
    headers,
    body: form.value.body
  })
}

function clearRequests() {
  apiStore.clearRequests()
}

function updateConcurrencyLimit(value: number) {
  apiStore.setConcurrencyLimit(value)
}

function getStatusType(status: string): '' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'pending': return 'primary'
    case 'running': return 'warning'
    case 'completed': return 'success'
    case 'error': return 'danger'
    default: return ''
  }
}

function getStatusTag(status: string): '' | 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'pending': return 'info'
    case 'running': return 'warning'
    case 'completed': return 'success'
    case 'error': return 'danger'
    default: return ''
  }
}

function getTimestamp(request: any): string {
  if (request.duration) {
    return `Duration: ${request.duration.toFixed(2)}ms`
  }
  return ''
}
</script>

<style scoped>
.api-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.request-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.url {
  flex: 1;
  margin: 0 10px;
  word-break: break-all;
}

.response pre {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.error {
  color: #f56c6c;
}

.concurrency-control {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.requests-list {
  margin-top: 30px;
}
</style>]]>
