import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


import pdfjsWorker from 'vite-plugin-pdfjs-worker';

// https://vite.dev/config/
export default defineConfig({
  base: '/TeacherPageTest/',
  plugins: [react(), pdfjsWorker()],
})
