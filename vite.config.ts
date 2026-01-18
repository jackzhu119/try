import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/qwen-chat': {
        target: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qwen-chat/, ''),
      },
    },
  },
});