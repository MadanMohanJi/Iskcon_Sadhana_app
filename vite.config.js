import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Iskcon_Sadhana_app/', // <-- MUST exactly match your repo name!
})