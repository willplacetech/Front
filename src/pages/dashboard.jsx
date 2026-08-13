import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import { ShoppingBagIcon, DocumentTextIcon, ArrowDownTrayIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [dados, setDados] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/produtos/relatorio'),
      api.get('/pedidos')
    ]).then(([r1, r2]) => {
      setDados(r1.data);
      setPedidos(r2.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Produtos Cadastrados', valor: dados.totalProdutos || 0, cor: 'from-blue-500 to-blue-700', icon: ShoppingBagIcon },
    { label: 'Importados',          valor: dados.importadosML || 0,   cor: 'from-cyan-500 to-cyan-700', icon: ArrowDownTrayIcon },
    { label: 'Total de Pedidos',    valor: pedidos.length || 0,       cor: 'from-violet-500 to-violet-700', icon: DocumentTextIcon },
    { label: 'Indisponíveis',       valor: dados.indisponiveis || 0,  cor: 'from-rose-500 to-rose-700', icon: XCircleIcon },
  ];

  return (
    <LayoutAdmin 
      loading={loading} 
      titulo="Dashboard" 
      subtitulo="Visão geral do sistema PLACETECH LINDOIA"
    >
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((c, i) => (
          <div key={i} className={`bg-gradient-to-br ${c.cor} text-white p-6 rounded-3xl shadow-xl`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm font-medium">{c.label}</p>
                <p className="text-4xl font-black mt-1">{c.valor}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <c.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acesso rápido */}
      <h3 className="text-lg font-bold text-slate-700 mb-4">Acesso Rápido</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/loja/produtos',   icon: '📦', texto: 'Gerenciar Produtos' },
          { to: '/loja/importar',   icon: '➕', texto: 'Adicionar Produto' },
          { to: '/loja/pedidos',    icon: '📋', texto: 'Ver Pedidos' },
          { to: '/loja/relatorios', icon: '📊', texto: 'Relatórios' },
        ].map(l => (
          <Link key={l.to} to={l.to} 
            className="bg-white p-6 rounded-2xl shadow border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition text-center">
            <div className="text-4xl mb-2">{l.icon}</div>
            <p className="font-bold text-slate-700 text-sm">{l.texto}</p>
          </Link>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white rounded-3xl shadow border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4">Últimos Pedidos</h3>
        {pedidos.length === 0 ? (
          <p className="text-slate-400 text-center py-10">Nenhum pedido ainda</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pedidos.map(p => (
              <div key={p._id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">{p.cliente.nome}</p>
                  <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-placetech-600">R$ {p.total.toFixed(2)}</p>
                  <span className={`badge badge-xs ${
                    p.status === 'pendente' ? 'badge-warning' :
                    p.status === 'confirmado' ? 'badge-info' :
                    p.status === 'entregue' ? 'badge-success' : 'badge-error'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}