import { useEffect, useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import Loading from '../components/Loading';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

const vazio = { nome: '', preco: '', precoPersonalizado: '', categoria: '', imagem: '', descricao: '', disponivel: true };

export default function ProdutosCrud() {
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = () => {
    setLoading(true);
    api.get('/produtos').then(r => setProdutos(r.data)).finally(() => setLoading(false));
  };
  useEffect(carregar, []);

  const salvar = async (e) => {
    e.preventDefault();
    const dados = {
      ...form,
      preco: Number(form.preco),
      precoPersonalizado: form.precoPersonalizado ? Number(form.precoPersonalizado) : null
    };
    editando 
      ? await api.put(`/produtos/${editando}`, dados)
      : await api.post('/produtos', dados);
    setForm(vazio); setEditando(null); setMostrarForm(false); carregar();
  };

  const editar = (p) => { setForm(p); setEditando(p._id); setMostrarForm(true); window.scrollTo(0,0); };
  const deletar = async (id) => { if(confirm('Excluir?')) { await api.delete(`/produtos/${id}`); carregar(); } };

  return (
    <LayoutAdmin 
      loading={loading}
      titulo="Produtos"
      subtitulo={`${produtos.length} produto(s) cadastrado(s)`}
    >
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <input placeholder="🔍 Filtrar produtos..." 
            className="input input-bordered w-full rounded-xl"
            onChange={(e) => {
              const t = e.target.value.toLowerCase();
              document.querySelectorAll('.linha-produto').forEach(tr => {
                tr.style.display = tr.textContent.toLowerCase().includes(t) ? '' : 'none';
              });
            }} />
        </div>
        <button onClick={() => { setForm(vazio); setEditando(null); setMostrarForm(!mostrarForm); }}
          className="btn btn-primary rounded-xl flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          {mostrarForm ? 'Fechar' : 'Novo Manual'}
        </button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <form onSubmit={salvar} className="bg-white p-6 rounded-2xl shadow border mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h3 className="col-span-2 font-bold text-slate-700 border-b pb-2">
            {editando ? 'Editar' : 'Novo'} Produto
          </h3>
          <input required placeholder="Nome" className="input input-bordered rounded-xl md:col-span-2"
            value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          <input required type="number" step="0.01" placeholder="Preço base" className="input input-bordered rounded-xl"
            value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} />
          <input type="number" step="0.01" placeholder="Seu preço (opcional)" className="input input-bordered rounded-xl"
            value={form.precoPersonalizado || ''} onChange={e => setForm({...form, precoPersonalizado: e.target.value})} />
          <input placeholder="Categoria" className="input input-bordered rounded-xl"
            value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
          <input placeholder="URL da imagem" className="input input-bordered rounded-xl"
            value={form.imagem} onChange={e => setForm({...form, imagem: e.target.value})} />
          <textarea placeholder="Descrição" className="textarea textarea-bordered rounded-xl md:col-span-2 h-24"
            value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          <label className="flex items-center gap-2 md:col-span-2 cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-primary" checked={form.disponivel}
              onChange={e => setForm({...form, disponivel: e.target.checked})} />
            <span className="font-medium">Disponível no catálogo</span>
          </label>
          <button className="btn btn-primary rounded-xl md:col-span-2">💾 Salvar</button>
        </form>
      )}

      {/* Tabela */}
      {loading ? <Loading /> : (
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th>Foto</th>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-16 text-slate-400">
                    Nenhum produto. <LinkInterno to="/loja/importar">Clique aqui para adicionar</LinkInterno>
                  </td></tr>
                )}
                {produtos.map(p => {
                  const preco = p.precoExibicao || p.preco;
                  return (
                    <tr key={p._id} className="linha-produto hover">
                      <td>
                        {p.imagem 
                          ? <img src={p.imagem} className="w-14 h-14 object-contain bg-slate-50 rounded-lg" />
                          : <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
                        }
                      </td>
                      <td className="font-semibold">{p.nome}</td>
                      <td>
                        <span className="font-black text-placetech-600">R$ {Number(preco).toFixed(2)}</span>
                        {p.precoPersonalizado && <div className="text-xs text-slate-400 line-through">R$ {Number(p.preco).toFixed(2)}</div>}
                      </td>
                      <td>{p.categoria || '-'}</td>
                      <td>
                        <span className={`badge badge-sm ${p.disponivel ? 'badge-success' : 'badge-error'}`}>
                          {p.disponivel ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button onClick={() => editar(p)} className="btn btn-ghost btn-xs text-blue-600">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(p._id)} className="btn btn-ghost btn-xs text-red-600">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </LayoutAdmin>
  );
}

import { Link } from 'react-router-dom';
function LinkInterno({ to, children }) { return <Link to={to} className="text-placetech-500 hover:underline font-semibold">{children}</Link>; }