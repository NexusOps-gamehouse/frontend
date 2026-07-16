import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:8080';

  return {
    plugins: [react()],
    define: {
      global: 'window', // sockjs-client 호환
    },
    server: {
      proxy: {
        '/api': backendOrigin,
        '/uploads': backendOrigin,
        '/ws': {
          target: backendOrigin,
          ws: true,
        },
      },
    },
  };
});
