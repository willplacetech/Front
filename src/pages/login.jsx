import { useState } from 'react';
import { useAuth } from '../context/auth';

export default function Login() {
  const { entrar } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await entrar(usuario, senha);
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível entrar');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#EBEBEB', padding: 24 }}>
      <form onSubmit={enviar} style={{ width: '100%', maxWidth: 400, background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.1)' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Área administrativa</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Entre para gerenciar sua loja.</p>
        {erro && <p role="alert" style={{ color: '#B91C1C', marginBottom: 16 }}>{erro}</p>}
        <label style={{ display: 'block', marginBottom: 16 }}>
          Usuário
          <input required value={usuario} onChange={(event) => setUsuario(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 12 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 24 }}>
          Senha
          <input required type="password" value={senha} onChange={(event) => setSenha(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 12 }} />
        </label>
        <button type="submit" disabled={carregando} style={{ width: '100%', padding: 12, background: '#3483FA', color: '#fff', border: 0, borderRadius: 8 }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
