import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173, 
    open: true
  },
  preview: { 
    port: 5173
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        passes: 2,
      },
      format: {
        comments: false,
      },
      mangle: {
        safari10: true,
      },
    },
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
