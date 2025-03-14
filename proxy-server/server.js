import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Handle preflight OPTIONS requests
app.options('/api/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-API-Token-Name, X-API-Token-Secret, X-Original-Base-Url');
  res.sendStatus(200);
});

app.use('/api', (req, res, next) => {
  const targetBaseUrl = req.headers['x-original-base-url']; // Extract the original base URL from headers

  // Log incoming request details
  console.log('Incoming Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  if (!targetBaseUrl) {
    console.error('Error: Missing target base URL');
    return res.status(400).send('Missing target base URL');
  }

  createProxyMiddleware({
    target: targetBaseUrl, // Use the extracted base URL as the target
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Remove the /api prefix
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-API-Token-Name', 'trustin');
      proxyReq.setHeader('X-API-Token-Secret', 'KLsr5E_PBLjasH0ixCW9edUqZFbSSobAomLsLvMXykM=');
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'; // Allow requests from your app's origin
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, X-API-Token-Name, X-API-Token-Secret';
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).send('Proxy encountered an error');
    }
  })(req, res, next);
});

app.listen(3000, () => {
  console.log('Proxy server is running on http://localhost:3000');
});
