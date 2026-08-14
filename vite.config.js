import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // 👇 ISSO AQUI É O QUE FAZ A ATUALIZAÇÃO FUNCIONAR
  server: {
    watch: {
      usePolling: true, // ✅ Detecta mudanças mesmo em pastas mapeadas/Windows
      interval: 1000,   // Verifica a cada 1 segundo
    },
    hmr: {
      overlay: true,    // Mostra erros na tela
    }
  }
});