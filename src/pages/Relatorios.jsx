import { useEffect, useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import Loading from '../components/Loading';

// CORES OFICIAIS PLACETECH
const AZUL = 'var(--brand)';
const VERDE = 'var(--success)';
const AMARELO = 'var(--brand)';

export default function Relatorios() {
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/produtos/administracao'), api.get('/pedidos')])
      .then(([r1, r2]) => {
        if (r1.status === 'fulfilled') setProdutos(r1.value.data);
        if (r2.status === 'fulfilled') setPedidos(r2.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const faturamento = pedidos.filter(p => p.status !== 'cancelado').reduce((s, p) => s + p.total, 0);

  const exportar = () => {
    let csv = 'Produto;Preço;Categoria;Status\n';
    produtos.forEach(p => {
      csv += `"${p.nome}";${(p.precoExibicao || p.preco).toFixed(2).replace('.', ',')};"${p.categoria || ''}";${p.disponivel ? 'Ativo' : 'Inativo'}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'placetech-produtos.csv';
    a.click();
  };

  const stats = [
    { label: 'Total Pedidos', valor: pedidos.length, cor: AZUL },
    { label: 'Faturamento', valor: `R$ ${faturamento.toFixed(2).replace('.', ',')}`, cor: VERDE },
    { label: 'Pendentes', valor: pedidos.filter(p => p.status === 'pendente').length, cor: AMARELO },
    { label: 'Total Produtos', valor: produtos.length, cor: 'var(--brand)' },
  ];

  return (
    <LayoutAdmin
      loading={loading}
      titulo="Relatórios"
      subtitulo="Dados gerenciais PLACETECH LINDOIA"
    >
      {/* BOTÃO EXPORTAR */}
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '24px'}}>
        <button
          onClick={exportar}
          style={{
            background: 'var(--brand)', color: 'var(--bg-base)', border: 'none',
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '14px', fontWeight: 800, cursor: 'pointer',
            transition: 'background 0.2s ease', boxShadow: '0 12px 22px rgba(245,165,36,0.18)'
          }}
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px', marginBottom: '32px'
      }}>
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)', padding: '24px',
              borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
              borderLeft: '1px solid var(--border)'
            }}
          >
            <p style={{fontSize: '14px', color: 'var(--text-secondary)', margin: 0, fontWeight: 600}}>
              {s.label}
            </p>
            <p style={{fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 0 0'}}>
              {s.valor}
            </p>
          </div>
        ))}
      </div>

      {/* TABELA DE PRODUTOS */}
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        padding: '24px'
      }}>
        <h3 style={{fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          Produtos Cadastrados
        </h3>

        {loading ? (
          <Loading />
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{backgroundColor: 'rgba(255,255,255,0.03)'}}>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>Produto</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>Preço</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>Categoria</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p._id} style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                    <td style={{padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>{p.nome}</td>
                    <td style={{padding: '14px 16px', fontSize: '14px', fontWeight: 800, color: 'var(--brand)'}}>
                      R$ {(p.precoExibicao || p.preco).toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{padding: '14px 16px', fontSize: '14px', color: 'var(--text-secondary)'}}>{p.categoria || '-'}</td>
                    <td style={{padding: '14px 16px'}}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: p.disponivel ? 'var(--bg-surface-2)' : 'var(--bg-surface-2)',
                        color: p.disponivel ? VERDE : 'var(--text-secondary)'
                      }}>
                        {p.disponivel ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
