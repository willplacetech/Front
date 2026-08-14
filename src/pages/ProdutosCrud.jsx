import { useState, useEffect } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';

// 🎯 CORES OFICIAIS — IGUAIS A PÁGINA DE PRODUTOS
const AMARELO = '#F9D828';
const AZUL = '#3483FA';
const VERDE = '#00A650';
const VERMELHO = '#EF4444';
const CINZA = '#F5F5F5';

const STATUS = ['pendente', 'confirmado', 'entregue', 'cancelado'];
const COR_STATUS = {
  pendente: { fundo: '#FBBF2422', texto: '#D97706' },
  confirmado: { fundo: '#3B82F622', texto: '#2563EB' },
  entregue: { fundo: '#22C55E22', texto: '#16A34A' },
  cancelado: { fundo: '#EF444422', texto: '#DC2626' }
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  const carregar = () => {
    setLoading(true);
    api.get('/pedidos')
      .then(r => {
        console.log("📦 Pedidos carregados:", r.data);
        setPedidos(r.data);
      })
      .finally(() => setLoading(false));
  };

  const mudarStatus = async (id, status) => {
    await api.put(`/pedidos/${id}/status`, { status });
    carregar();
  };

  return (
    <LayoutAdmin titulo="Pedidos" subtitulo="Acompanhe e gerencie os pedidos recebidos">

      {/* 📋 TABELA — EXATAMENTE IGUAL AO LAYOUT DE PRODUTOS */}
      {loading ? (
        <div style={{padding: '60px', textAlign: 'center'}}>
          <div style={{width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: AZUL, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto'}} />
          <p style={{marginTop: '12px', color: '#666'}}>Carregando pedidos...</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden'
        }}>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{backgroundColor: CINZA}}>
                  {['Cliente', 'Itens', 'Total', 'Data', 'Status', 'Ações'].map((h,i) => (
                    <th key={i} style={{
                      padding: '14px 16px', textAlign: i===5 ? 'right' : 'left',
                      fontSize: '13px', fontWeight: 600, color: '#444', textTransform: 'uppercase'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{padding: '60px 20px', textAlign: 'center', color: '#999'}}>
                      Nenhum pedido recebido ainda.
                    </td>
                  </tr>
                ) : pedidos.map(p => {
                  // 🔍 Tenta TODOS os formatos possíveis do campo cliente
                  const cliente = p.dadosCliente || p.cliente || {};
                  const nome = cliente?.nome || 'Nome não informado';
                  const telefone = cliente?.telefone || '';
                  const data = p.criadoEm || p.createdAt;
                  const estiloStatus = COR_STATUS[p.status] || COR_STATUS.pendente;

                  return (
                    <tr key={p._id} style={{borderTop: '1px solid #f0f0f0', transition: 'background 0.15s'}}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Cliente */}
                      <td style={{padding: '12px 16px'}}>
                        <div style={{fontWeight: 600, color: '#222'}}>{nome}</div>
                        {telefone && <div style={{fontSize: '12px', color: '#888'}}>{telefone}</div>}
                      </td>

                      {/* Itens */}
                      <td style={{padding: '12px 16px', fontSize: '13px', color: '#555'}}>
                        {p.itens?.length > 0 
                          ? p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ')
                          : '-'}
                      </td>

                      {/* Total */}
                      <td style={{padding: '12px 16px'}}>
                        <div style={{fontWeight: 700, fontSize: '15px', color: AZUL}}>
                          R$ {Number(p.total).toFixed(2).replace('.', ',')}
                        </div>
                      </td>

                      {/* Data */}
                      <td style={{padding: '12px 16px', fontSize: '13px', color: '#666'}}>
                        {data ? new Date(data).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Status */}
                      <td style={{padding: '12px 16px'}}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: estiloStatus.fundo,
                          color: estiloStatus.texto
                        }}>
                          {(p.status || 'pendente').toUpperCase()}
                        </span>
                      </td>

                      {/* Ações — Botões de Status */}
                      <td style={{padding: '12px 16px', textAlign: 'right'}}>
                        <div style={{display: 'flex', gap: '4px', justifyContent: 'right', flexWrap: 'wrap'}}>
                          {STATUS.map(s => (
                            <button
                              key={s}
                              onClick={() => mudarStatus(p._id, s)}
                              style={{
                                padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: 'none',
                                backgroundColor: p.status === s ? AZUL : '#f0f0f0',
                                color: p.status === s ? 'white' : '#555',
                                cursor: 'pointer', fontWeight: p.status === s ? 600 : 400
                              }}
                            >
                              {s}
                            </button>
                          ))}
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