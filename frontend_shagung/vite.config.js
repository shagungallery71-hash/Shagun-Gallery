import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://shagun-backend-kbbh.onrender.com')
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://shagun-backend-kbbh.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
