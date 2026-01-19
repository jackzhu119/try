import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      proxy: {
        '/api/qwen/text': {
          target: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen\/text/, '')
        },
        '/api/qwen/multimodal': {
          target: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen\/multimodal/, '')
        }
      }
    }
  };
});