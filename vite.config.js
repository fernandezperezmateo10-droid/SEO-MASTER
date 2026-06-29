import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Inyectar la API key automáticamente en desarrollo local
              const apiKey = env.VITE_ANTHROPIC_API_KEY || env.VITE_CLAUDE_API_KEY || env.ANTHROPIC_API_KEY || '';
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey);
              }
            });
          }
        },
      },
    },
  }
})
