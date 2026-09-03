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
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at top, rgba(245,164,0,0.18), transparent 32%), linear-gradient(180deg, #090909 0%, #151515 100%)',
      padding: 24
    }}>
      <form onSubmit={enviar} style={{
        width: '100%',
        maxWidth: 430,
        background: 'linear-gradient(180deg, rgba(18,18,18,0.96) 0%, rgba(11,11,11,0.98) 100%)',
        padding: 32,
        borderRadius: 20,
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #f5a400 0%, #e89d00 100%)',
            color: '#111111', fontWeight: 900, fontSize: 24,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 30px rgba(245,164,0,0.25)', marginBottom: 12
          }}>P</div>
          <h1 style={{ fontSize: 28, marginBottom: 8, color: '#f7f7f3', fontWeight: 800 }}>Área administrativa</h1>
          <p style={{ color: '#b8b3ae', marginBottom: 0 }}>Entre para gerenciar sua loja.</p>
        </div>
        {erro && <p role="alert" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.18)', padding: '10px 12px', borderRadius: '10px', marginBottom: 16 }}>{erro}</p>}
        <label style={{ display: 'block', marginBottom: 16, color: '#ddd8d3', fontWeight: 600 }}>
          Usuário
          <input required value={usuario} onChange={(event) => setUsuario(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 8, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: '#f7f7f3', outline: 'none' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 24, color: '#ddd8d3', fontWeight: 600 }}>
          Senha
          <input required type="password" value={senha} onChange={(event) => setSenha(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 8, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: '#f7f7f3', outline: 'none' }} />
        </label>
        <button type="submit" disabled={carregando} style={{ width: '100%', padding: '14px 16px', background: 'linear-gradient(135deg, #f5a400 0%, #e89d00 100%)', color: '#111111', border: 0, borderRadius: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 18px 36px rgba(245,164,0,0.18)' }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
