import { useEffect, useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import Loading from '../components/Loading';

const STATUS = ['pendente', 'confirmado', 'entregue', 'cancelado'];
const BADGE = {
  pendente: 'badge-warning', confirmado: 'badge-info', 
  entregue: 'badge-success', cancelado: 'badge-error'
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pedidos').then(r => setPedidos(r.data)).finally(() => setLoading(false));
  }, []);

  const mudar = async (id, status) => {
    await api.put(`/pedidos/${id}/status`, { status });
    setPedidos(prev => prev.map(p => p._id === id ? { ...p, status } : p));
  };

  return (
    <LayoutAdmin 
      loading={loading}
      titulo="Pedidos"
      subtitulo={`${pedidos.length} pedido(s) recebido(s)`}
    >
      {loading ? <Loading /> : pedidos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <div className="text-7xl mb-4">📭</div>
          <p className="text-slate-400">Nenhum pedido ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(p => (
            <div key={p._id} className="bg-white rounded-2xl shadow border p-6 hover:shadow-lg transition">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="font-black text-lg text-slate-800">👤 {p.cliente.nome}</p>
                  <p className="text-slate-500 text-sm">📱 {p.cliente.telefone}</p>
                  {p.cliente.endereco && <p className="text-slate-400 text-sm">📍 {p.cliente.endereco}</p>}
                  <p className="text-xs text-slate-300 mt-1">🕐 {new Date(p.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-placetech-600">R$ {p.total.toFixed(2)}</p>
                  <span className={`badge badge-lg mt-2 ${BADGE[p.status]}`}>{p.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Itens</p>
                {p.itens.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="text-slate-600">{i.quantidade}x {i.nome}</span>
                    <span className="font-semibold">R$ {(i.preco * i.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS.map(s => (
                  <button key={s} onClick={() => mudar(p._id, s)}
                    className={`btn btn-xs rounded-xl ${p.status === s ? 'btn-primary' : 'btn-ghost'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </LayoutAdmin>
  );
}