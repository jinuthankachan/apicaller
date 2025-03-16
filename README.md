# API Caller

A Vue 3 + TypeScript application for testing and monitoring API endpoints.

## Features

- Support for GET, POST, PUT, DELETE methods
- Custom headers management
- JSON body editor for non-GET requests
- Concurrent request handling (configurable limit)
- Request history with status tracking
- Response/error display
- Request duration tracking
- cURL command import functionality
- Request cancellation support

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the proxy server:
   ```bash
   node proxy-server/server.js
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Enter the API endpoint URL
2. Select the HTTP method
3. Add custom headers if needed
4. For non-GET requests, provide the request body
5. Click "Send" to execute the request
6. View the response and status in the request history

## Technology Stack

- Vue 3
- TypeScript
- Pinia (state management)
- Element Plus (UI components)
- Axios (HTTP client)
- Vite (build tool)
