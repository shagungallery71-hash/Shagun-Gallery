import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://shagungallery.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
