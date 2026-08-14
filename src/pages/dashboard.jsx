import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import { ShoppingBagIcon, DocumentTextIcon, ArrowDownTrayIcon, XCircleIcon, CheckCircleIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const AMARELO = '#F9D828';
const AZUL = '#3483FA';
const VERDE = '#00A650';
const CINZA = '#6B7280';

export default function Dashboard() {
  const [dados, setDados] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/produtos/relatorio'),
      api.get('/pedidos')
    ]).then(([resProd, resPed]) => {
      if (resProd.status === 'fulfilled') setDados(resProd.value.data);
      if (resPed.status === 'fulfilled') setPedidos(resPed.value.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { 
      label: 'Produtos Cadastrados', 
      valor: dados.totalProdutos || 0, 
      icone: ShoppingBagIcon,
      cor: AZUL
    },
    { 
      label: 'Importados', 
      valor: dados.importadosML || 0, 
      icone: ArrowDownTrayIcon,
      cor: AMARELO
    },
    { 
      label: 'Total de Pedidos', 
      valor: pedidos.length, 
      icone: DocumentTextIcon,
      cor: VERDE
    },
    { 
      label: 'Indisponíveis', 
      valor: dados.indisponiveis || 0, 
      icone: XCircleIcon,
      cor: '#EF4444'
    },
  ];

  const statusBadge = {
    pendente: { classe: 'bg-warning text-dark', icone: ClockIcon, texto: 'Pendente' },
    confirmado: { classe: 'bg-primary text-white', icone: CheckCircleIcon, texto: 'Confirmado' },
    entregue: { classe: 'bg-success text-white', icone: CheckCircleIcon, texto: 'Entregue' },
    cancelado: { classe: 'bg-secondary text-white', icone: XCircleIcon, texto: 'Cancelado' },
  };

  return (
    <LayoutAdmin 
      loading={loading}
      titulo="Dashboard"
      subtitulo="Visão geral do sistema Placetech Lindoia"
    >
      {/* 📊 CARDS ESTATÍSTICOS */}
      <div className="row g-4 mb-4">
        {cards.map((card, i) => (
          <div key={i} className="col-sm-6 col-md-3">
            <div className=" card-padrao p-3 h-100 align-self-end ">
              <div className="d-flex align-items-center">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',  /* Alinha pela linha de base das letras */
                  justifyContent: 'center', /* Centraliza o conjunto inteiro */
                  gap: '6px'                /* Espaço entre texto e número */
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{card.label}</p>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '32px', 
                    fontWeight: '700',
                    lineHeight: '1'
                  }}>{card.valor}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* ⚡ ACESSO RÁPIDO */}
        <div className="col-md-5">
          <div className="card card-padrao p-4 h-100">
            <div className="d-grid gap-1">
              {[
                { to: '/loja/produtos', icone: ShoppingBagIcon, texto: 'Gerenciar Produtos' },
                { to: '/loja/importar', icone: ArrowDownTrayIcon, texto: 'Adicionar Produto' },
                { to: '/loja/pedidos', icone: DocumentTextIcon, texto: 'Ver Pedidos' },
                { to: '/loja/relatorios', icone: ChartBarIcon, texto: 'Relatórios' },
              ].map(item => (
                <Link key={item.to} to={item.to} 
                  className="d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none text-dark hover:bg-light border transition">
                  <div className="rounded-2 p-2" style={{backgroundColor: `${AZUL}10`}}>
                    <item.icone style={{width: '18px', height: '18px', color: AZUL}} />
                  </div>
                  <div>
                    <p className="fw-medium mb-0">{item.texto}</p>
                    <p className="small text-muted mb-0">{item.desc}</p>
                  </div>
                  <span className="ms-auto text-muted">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 📋 ÚLTIMOS PEDIDOS */}
        <div className="col-md-7">
          <div className="card card-padrao p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Últimos Pedidos</h5>
              <Link to="/loja/pedidos" className="btn btn-sm btn-outline-secondary">Ver todos</Link>
            </div>

            {pedidos.length === 0 ? (
              <div className="text-center py-5">
                <p className="fs-1 mb-2">📭</p>
                <p className="text-muted">Nenhum pedido recebido ainda</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <thead>
                    <tr className="text-muted small">
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map(p => {
                      const s = statusBadge[p.status] || { classe: 'bg-light', texto: p.status };
                      return (
                        <tr key={p._id} className="border-top">
                          <td className="fw-medium">{p.cliente?.nome || 'Cliente'}</td>
                          <td className="small text-muted">
                            {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="fw-bold" style={{color: AZUL}}>
                            R$ {Number(p.total).toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${s.classe}`}>
                              {s.texto}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}