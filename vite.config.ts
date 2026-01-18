import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // 使用您提供的 API Key 作为默认值
  const apiKey = env.API_KEY || "sk-7feaffc8c8684241a522c673ebc68aa5";
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      proxy: {
        '/api/qwen': {
          target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
        }
      }
    }
  };
});