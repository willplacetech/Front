import { useState, useEffect } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';

// 🎯 CORES OFICIAIS — IDÊNTICAS À PÁGINA DE PRODUTOS
const VERDE = 'var(--brand)';
const VERMELHO = 'var(--text-secondary)';

const STATUS = ['pendente', 'confirmado', 'entregue', 'cancelado'];

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    api.get('/pedidos')
      .then(r => {
        console.log("📦 Pedidos carregados:", r.data);
        setPedidos(r.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const mudarStatus = async (id, status) => {
    await api.put(`/pedidos/${id}/status`, { status });
    carregar();
  };

  // Retorna cor do status — IGUAL AO ESTILO DA PÁGINA DE PRODUTOS
  const getCorStatus = (status) => {
    switch(status) {
      case 'pendente': return { fundo: '#F5A52415', texto: 'var(--brand)' };
      case 'confirmado': return { fundo: '#F5A52415', texto: 'var(--brand)' };
      case 'entregue': return { fundo: 'var(--bg-surface-2)', texto: VERDE };
      case 'cancelado': return { fundo: 'var(--bg-surface-2)', texto: VERMELHO };
      default: return { fundo: '#F5A52415', texto: 'var(--brand)' };
    }
  };

  return (
    <LayoutAdmin titulo="Pedidos" subtitulo="Acompanhe e gerencie os pedidos recebidos">

      {/* 📋 TABELA — ESTRUTURA EXATA DA PÁGINA DE PRODUTOS */}
      {loading ? (
        <div style={{padding: '60px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)'}}>
          <div style={{width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto'}} />
          <p style={{marginTop: '12px', color: 'var(--text-secondary)'}}>Carregando pedidos...</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '18px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.22)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: 'rgba(255,255,255,0.03)'}}>
                  {/* 👇 CABEÇALHO IGUAL AO DE PRODUTOS */}
                  {['Cliente', 'Itens', 'Total', 'Data', 'Status', 'Ações'].map((h,i) => (
                    <th key={i} style={{
                      padding: '14px 16px', textAlign: i===5 ? 'right' : 'left',
                      fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
                      Nenhum pedido recebido ainda.
                    </td>
                  </tr>
                ) : pedidos.map(p => {
                  // 🔍 Tenta TODOS os formatos possíveis do campo cliente
                  const cliente = p.dadosCliente || p.cliente || {};
                  const nome = cliente?.nome || 'Nome não informado';
                  const telefone = cliente?.telefone || '';
                  const data = p.criadoEm || p.createdAt;
                  const corStatus = getCorStatus(p.status);

                  return (
                    <tr key={p._id} style={{borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s'}}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* 🧑 CLIENTE — IGUAL AO ESTILO "Produto" da outra página */}
                      <td style={{padding: '12px 16px'}}>
                        <div style={{fontWeight: 700, color: 'var(--text-primary)'}}>{nome}</div>
                        {telefone && <div style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px'}}>{telefone}</div>}
                      </td>

                      {/* 📦 ITENS */}
                      <td style={{padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px'}}>
                        {p.itens?.length > 0
                          ? p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ')
                          : '-'}
                      </td>

                      {/* 💰 TOTAL — IGUAL AO PREÇO DA PÁGINA DE PRODUTOS */}
                      <td style={{padding: '12px 16px'}}>
                        <div style={{fontWeight: 800, fontSize: '15px', color: 'var(--brand)'}}>
                          R$ {Number(p.total).toFixed(2).replace('.', ',')}
                        </div>
                      </td>

                      {/* 📅 DATA */}
                      <td style={{padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)'}}>
                        {data ? new Date(data).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* 🟢 STATUS — IGUAL AO BADGE DA PÁGINA DE PRODUTOS */}
                      <td style={{padding: '12px 16px'}}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: corStatus.fundo,
                          color: corStatus.texto
                        }}>
                          {(p.status || 'pendente').toUpperCase()}
                        </span>
                      </td>

                      {/* ⚙️ AÇÕES — IGUAL AOS BOTÕES DE EDITAR/EXCLUIR */}
                     <td style={{padding: '12px 16px', textAlign: 'right'}}>
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    justifyContent: 'flex-end',
    maxWidth: '160px',
    marginLeft: 'auto'
  }}>
    {STATUS.map(s => {
      const isAtivo = p.status === s;
      const cor = getCorStatus(s);
      return (
        <button
          key={s}
          onClick={() => mudarStatus(p._id, s)}
          style={{
            padding: '4px 6px', fontSize: '11px', borderRadius: '8px', border: 'none',
            backgroundColor: isAtivo ? cor.texto : `${cor.texto}10`,
            color: isAtivo ? 'white' : cor.texto,
            cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.15s',
            textAlign: 'center'
          }}
          title={`Marcar como ${s}`}
        >
          {s}
        </button>
      );
    })}
  </div>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </LayoutAdmin>
  );
}
