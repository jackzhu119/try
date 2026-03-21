
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  // Using the specific Qwen API Key provided
  const apiKey = "sk-e5e7b33d1f684e66be3cd51e52ae0bab";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api/qwen/text': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen\/text/, '/api/v1/services/aigc/text-generation/generation')
        },
        '/api/qwen/multimodal': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen\/multimodal/, '/api/v1/services/aigc/multimodal-generation/generation')
        }
      }
    }
  };
});
