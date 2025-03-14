<template>
  <div class="api-view">
    <div class="actions-bar">
      <el-button @click="showImportDialog = true" type="primary" plain>
        <el-icon><Upload /></el-icon>
        Import cURL
      </el-button>
    </div>

    <el-dialog
      v-model="showImportDialog"
      title="Import cURL Command"
      width="50%"
    >
      <el-input
        v-model="curlCommand"
        type="textarea"
        :rows="5"
        placeholder="Paste your cURL command here..."
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">Cancel</el-button>
          <el-button type="primary" @click="importCurl">
            Import
          </el-button>
        </span>
      </template>
    </el-dialog>

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
      <el-collapse>
        <el-collapse-item v-for="(request, index) in requests" :key="index" :title="`${request.method} ${request.url} - ${request.status}`">
          <div>
            <p><strong>Method:</strong> {{ request.method }}</p>
            <p><strong>URL:</strong> {{ request.url }}</p>
            <p><strong>Time Taken:</strong> {{ request.duration }} ms</p>
            <div v-if="request.response">
              <p><strong>Response Status:</strong> {{ request.response.status }}</p>
              <p><strong>Response Headers:</strong></p>
              <pre>{{ JSON.stringify(request.response.headers, null, 2) }}</pre>
              <p><strong>Response Body:</strong></p>
              <pre>{{ JSON.stringify(request.response.data, null, 2) }}</pre>
            </div>
            <div v-if="request.status === 'error' && request.error">
              <p><strong>Error:</strong></p>
              <pre>{{ request.error }}</pre>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApiStore } from '@/stores/apiStore'
import { Delete, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { parseCurlCommand } from '@/utils/curlParser'

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
const showImportDialog = ref(false)
const curlCommand = ref('')

const requests = computed(() => apiStore.requests.slice().reverse())
const lastRequest = computed(() => requests.value[requests.value.length - 1])

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

function getStatusClass(status: string): string {
  switch (status) {
    case 'pending': return 'status-processing'
    case 'running': return 'status-processing'
    case 'completed': return 'status-success'
    case 'error': return 'status-error'
    default: return ''
  }
}

function getTimestamp(request: any): string {
  if (request.duration) {
    return `Duration: ${request.duration.toFixed(2)}ms`
  }
  return ''
}

function importCurl() {
  try {
    const parsed = parseCurlCommand(curlCommand.value)
    
    // Update form with parsed values
    form.value.url = parsed.url
    form.value.method = parsed.method
    form.value.body = parsed.body
    
    // Update headers
    headerRows.value = Object.keys(parsed.headers).map(() => 1)
    headerKeys.value = Object.keys(parsed.headers)
    headerValues.value = Object.values(parsed.headers)
    
    showImportDialog.value = false
    curlCommand.value = ''
  } catch (error) {
    ElMessage.error('Failed to parse cURL command. Please check the format.')
  }
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

pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
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

.actions-bar {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.status-processing {
  color: orange;
  animation: blink 1s step-end infinite;
}

.status-success {
  color: green;
}

.status-error {
  color: red;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
