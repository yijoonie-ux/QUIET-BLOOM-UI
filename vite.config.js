import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 같은 네트워크의 휴대폰에서 접속해 확인할 수 있도록 LAN에 노출
    host: true,
  },
})
