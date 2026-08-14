import { useEffect, useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import Loading from '../components/Loading';

// CORES OFICIAIS PLACETECH
const AZUL = '#3483FA';
const VERDE = '#00A650';
const AMARELO = '#F9D828';
const CINZA = '#F5F5F5';
const PRETO = '#000000';

export default function Relatorios() {
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/produtos'), api.get('/pedidos')])
      .then(([r1, r2]) => { setProdutos(r1.data); setPedidos(r2.data); })
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
    { label: 'Total Produtos', valor: produtos.length, cor: '#9333EA' },
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
            backgroundColor: AZUL, color: 'white', border: 'none',
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={e => e.target.style.backgroundColor = '#2968D3'}
          onMouseOut={e => e.target.style.backgroundColor = AZUL}
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
              backgroundColor: 'white', padding: '24px',
              borderRadius: '16px', border: '1px solid #eee',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${s.cor}`
            }}
          >
            <p style={{fontSize: '14px', color: '#666', margin: 0, fontWeight: 500}}>
              {s.label}
            </p>
            <p style={{fontSize: '32px', fontWeight: 700, color: PRETO, margin: '8px 0 0 0'}}>
              {s.valor}
            </p>
          </div>
        ))}
      </div>

      {/* TABELA DE PRODUTOS */}
      <div style={{
        backgroundColor: 'white', borderRadius: '16px',
        border: '1px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '24px'
      }}>
        <h3 style={{fontSize: '18px', fontWeight: 700, color: '#333', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid #eee'}}>
          Produtos Cadastrados
        </h3>

        {loading ? (
          <Loading />
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{backgroundColor: CINZA}}>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#444', borderBottom: '1px solid #ddd'}}>Produto</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#444', borderBottom: '1px solid #ddd'}}>Preço</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#444', borderBottom: '1px solid #ddd'}}>Categoria</th>
                  <th style={{padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#444', borderBottom: '1px solid #ddd'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p._id} style={{borderBottom: '1px solid #f0f0f0'}}>
                    <td style={{padding: '14px 16px', fontSize: '14px', fontWeight: 500}}>{p.nome}</td>
                    <td style={{padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: AZUL}}>
                      R$ {(p.precoExibicao || p.preco).toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{padding: '14px 16px', fontSize: '14px', color: '#555'}}>{p.categoria || '-'}</td>
                    <td style={{padding: '14px 16px'}}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: p.disponivel ? '#ECFDF3' : '#FEF2F2',
                        color: p.disponivel ? VERDE : '#DC2626'
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