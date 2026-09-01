import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const renderSpaFallback = {
  name: 'render-spa-fallback',
  closeBundle() {
    const indexPath = path.resolve(process.cwd(), 'dist/index.html');
    const fallbackPath = path.resolve(process.cwd(), 'dist/404.html');
    fs.copyFileSync(indexPath, fallbackPath);
  }
};

export default defineConfig({
  plugins: [react(), renderSpaFallback],
  
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