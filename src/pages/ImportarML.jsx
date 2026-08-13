import { useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import { 
  ArrowDownTrayIcon, CheckIcon, ExclamationTriangleIcon, 
  LinkIcon, PhotoIcon, CurrencyDollarIcon, TagIcon
} from '@heroicons/react/24/outline';

export default function ImportarML() {
  const [link, setLink] = useState('');
  const [modo, setModo] = useState('link');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [produto, setProduto] = useState({
    nome: '', preco: '', imagem: '', categoria: '', descricao: ''
  });

  const extrair = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');
    if (!link.startsWith('http')) { setErro('Cole um link válido'); return; }
    setCarregando(true);
    try {
      const r = await api.post('/ml/extrair-link', { url: link });
      setProduto({
        ...r.data,
        preco: r.data.preco ? String(r.data.preco) : ''
      });
      setSucesso('Dados extraídos! Confira abaixo e salve.');
      setModo('form');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro');
      setProduto(p => ({ ...p, linkML: link }));
      setModo('form');
    }
    setCarregando(false);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');
    try {
      await api.post('/ml/importar', {
        ...produto,
        galeria: produto.imagem ? [produto.imagem] : []
      });
      setSucesso('🎉 PRODUTO SALVO! Já está no catálogo.');
      setLink(''); setModo('link');
      setProduto({ nome: '', preco: '', imagem: '', categoria: '', descricao: '' });
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro');
    }
  };

  return (
    <LayoutAdmin 
      loading={carregando}
      titulo="Novo Produto"
      subtitulo="Importe via link ou cadastre manualmente"
    >
      {erro && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 font-medium">{erro}</p>
        </div>
      )}
      {sucesso && (
        <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-700 font-bold">{sucesso}</p>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setModo('link')}
          className={`px-5 py-3 rounded-xl font-bold text-sm transition ${
            modo === 'link' ? 'bg-placetech-500 text-white shadow-lg' : 'bg-white text-slate-600 border'
          }`}>
          <span className="flex items-center gap-2"><LinkIcon className="w-5 h-5" /> 🔗 Por Link</span>
        </button>
        <button onClick={() => setModo('form')}
          className={`px-5 py-3 rounded-xl font-bold text-sm transition ${
            modo === 'form' ? 'bg-placetech-500 text-white shadow-lg' : 'bg-white text-slate-600 border'
          }`}>
          ✍️ Manual
        </button>
      </div>

      {/* Link */}
      {modo === 'link' && (
        <div className="bg-gradient-to-r from-placetech-500 to-placetech-900 p-8 rounded-3xl shadow-xl mb-8">
          <h3 className="text-white text-xl font-bold mb-2">Passo 1: Cole o link do produto</h3>
          <p className="text-white/80 mb-6 text-sm">
            Funciona com QUALQUER loja: Mercado Livre, Amazon, Magazine, Netshoes, etc.
          </p>
          <form onSubmit={extrair} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <LinkIcon className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={link} onChange={e => setLink(e.target.value)}
                placeholder="https://www.mercadolivre.com.br/..."
                className="w-full pl-14 pr-6 py-4 rounded-2xl text-slate-800 text-lg shadow-inner focus:outline-none focus:ring-4 focus:ring-white/30" />
            </div>
            <button className="bg-white text-placetech-600 hover:bg-slate-100 px-8 rounded-2xl font-black shadow-lg transition">
              EXTRAIR DADOS
            </button>
          </form>
        </div>
      )}

      {/* Formulário */}
      {modo === 'form' && (
        <form onSubmit={salvar} className="bg-white p-8 rounded-3xl shadow border border-slate-100 space-y-5">
          <h3 className="text-lg font-bold text-slate-700 border-b pb-3">Dados do Produto</h3>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
              <TagIcon className="w-4 h-4" /> Nome *
            </label>
            <input required value={produto.nome} onChange={e => setProduto({...produto, nome: e.target.value})}
              className="input input-bordered w-full rounded-xl py-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                <CurrencyDollarIcon className="w-4 h-4" /> Preço (R$) *
              </label>
              <input required type="number" step="0.01" value={produto.preco}
                onChange={e => setProduto({...produto, preco: e.target.value})}
                className="input input-bordered w-full rounded-xl py-6" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Categoria</label>
              <input value={produto.categoria} onChange={e => setProduto({...produto, categoria: e.target.value})}
                className="input input-bordered w-full rounded-xl py-6" placeholder="Ex: Eletrônicos" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
              <PhotoIcon className="w-4 h-4" /> URL da Imagem
            </label>
            <input value={produto.imagem} onChange={e => setProduto({...produto, imagem: e.target.value})}
              className="input input-bordered w-full rounded-xl py-6" placeholder="https://...foto.jpg" />
            {produto.imagem && (
              <img src={produto.imagem} className="mt-3 w-28 h-28 object-contain bg-slate-50 rounded-xl border p-2" 
                onError={e => e.currentTarget.src='https://placehold.co/200'} />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Descrição</label>
            <textarea value={produto.descricao} onChange={e => setProduto({...produto, descricao: e.target.value})}
              className="textarea textarea-bordered w-full rounded-xl h-28" />
          </div>

          <div className="flex gap-3 pt-4">
            <button className="flex-1 bg-gradient-to-r from-placetech-500 to-placetech-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5" /> 💾 SALVAR PRODUTO
            </button>
            <button type="button" onClick={() => setModo('link')}
              className="btn btn-ghost btn-lg rounded-2xl">Voltar</button>
          </div>
        </form>
      )}
    </LayoutAdmin>
  );
}