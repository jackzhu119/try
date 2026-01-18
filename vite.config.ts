import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // On Vercel, API_KEY is available in process.env (system env).
  // Locally, it might be in the loaded `env` object.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This allows the code to access process.env.API_KEY as if it were Node.js
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});