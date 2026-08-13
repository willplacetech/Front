import { useEffect, useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import Loading from '../components/Loading';

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
      csv += `"${p.nome}";${(p.precoExibicao || p.preco).toFixed(2)};"${p.categoria || ''}";${p.disponivel ? 'Ativo' : 'Inativo'}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'placetech-produtos.csv';
    a.click();
  };

  const stats = [
    { label: 'Total Pedidos',    valor: pedidos.length,            cor: 'bg-blue-500' },
    { label: 'Faturamento',      valor: `R$ ${faturamento.toFixed(2)}`, cor: 'bg-emerald-500' },
    { label: 'Pendentes',        valor: pedidos.filter(p => p.status === 'pendente').length, cor: 'bg-amber-500' },
    { label: 'Total Produtos',   valor: produtos.length,           cor: 'bg-violet-500' },
  ];

  return (
    <LayoutAdmin 
      loading={loading}
      titulo="Relatórios"
      subtitulo="Dados gerenciais PLACETECH LINDOIA"
    >
      <div className="flex justify-end mb-6">
        <button onClick={exportar} className="btn btn-primary rounded-xl">⬇️ Exportar CSV</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow border-l-8" style={{borderLeftColor: 'var(--tw-gradient-from)'}}>
            <div className={`w-1 h-10 ${s.cor} absolute`}></div>
            <p className="text-slate-400 text-sm font-medium">{s.label}</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{s.valor}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow border p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4">Produtos Cadastrados</h3>
        {loading ? <Loading /> : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Categoria</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p._id} className="hover">
                    <td className="font-medium">{p.nome}</td>
                    <td className="font-bold text-placetech-600">R$ {(p.precoExibicao || p.preco).toFixed(2)}</td>
                    <td>{p.categoria || '-'}</td>
                    <td><span className={`badge badge-sm ${p.disponivel ? 'badge-success' : 'badge-error'}`}>{p.disponivel ? 'Ativo' : 'Inativo'}</span></td>
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