import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ ngoài container
    port: 3001       // Đổi sang cổng 3001
  },
})