import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1356,
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2', '@supabase/supabase-js'],
  },
})
