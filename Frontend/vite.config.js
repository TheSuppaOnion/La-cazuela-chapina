import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './', // Rutas relativas para build
  build: {
    outDir: 'dist',
    assetsDir: 'assets2'
  },
  // CONFIGURACIÓN DE PROXY PARA CORS
  server: {
    port: 5173,
    // Only proxy API calls to local backend during development.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  // VARIABLES DE ENTORNO PARA DIFERENTES AMBIENTES
  define: {
    __IS_DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  }
})