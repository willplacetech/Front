import { createServer } from 'vite';

// Iniciar e fechar o Vite no mesmo processo evita deixar servidores filhos
// abertos ao encerrar os testes no Windows.
export default async function prepararServidor() {
  const servidor = await createServer({
    server: { host: '127.0.0.1', port: 5175, strictPort: true },
    clearScreen: false,
    logLevel: 'error'
  });
  await servidor.listen();
  return () => servidor.close();
}
