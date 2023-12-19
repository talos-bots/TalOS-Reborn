import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/socket.io': {
        target: 'http://localhost:3003/socket.io/',
        changeOrigin: false,
        secure: false,
        ws: true,
      },
      '/images': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
      '/pfp': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
      '/backgrounds': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
      '/sprites': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: false,
      }
    }
  },
})
