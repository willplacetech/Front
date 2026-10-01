import { useState } from 'react';
import api from '../services/api';
import './Variantes.css';

export default function EditorVariantes({ produto, onClose, onSalvo }) {
  const [form, setForm] = useState(() => ({ ...produto, variants: produto.variants.map(v => ({ ...v })) }));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const alterar = (indice, campo, valor) => setForm(atual => ({ ...atual, variants: atual.variants.map((v, i) => i === indice ? { ...v, [campo]: valor } : v) }));

  const salvar = async event => {
    event.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await api.put(`/produtos/${produto._id}`, {
        nome: form.nome, marca: form.marca, categoria: form.categoria, specs: form.specs,
        descricao: form.descricao, disponivel: form.disponivel,
        variants: form.variants.map(v => ({ ...v, imagens: (v.imagens || []).map(src => src.trim()).filter(Boolean), preco: Number(v.preco),
          precoCusto: v.precoCusto ? Number(v.precoCusto) : undefined,
          estoque: v.estoque === null || v.estoque === '' ? null : Number(v.estoque) }))
      });
      onSalvo();
    } catch (error) { setErro(error.response?.data?.error || 'Não foi possível salvar as variantes.'); }
    finally { setSalvando(false); }
  };

  return <form className="variant-editor" onSubmit={salvar}>
    <h3>Editar {produto.nome} · {form.variants.length} variantes</h3>
    <p>Estoque vazio indica venda sob encomenda. Zero indica indisponibilidade.</p>
    <div className="variant-editor-row">
      <label>Modelo<input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></label>
      <label>Marca<input required value={form.marca || ''} onChange={e => setForm({ ...form, marca: e.target.value })} /></label>
      <label>Categoria<select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={{ padding: 12, borderRadius: 12, background: '#151515', color: '#f7f7f3' }}>{['Lacrado', 'CPO', 'Watch'].map(c => <option key={c}>{c}</option>)}</select></label>
    </div>
    <div className="variant-editor-row">
      {[['tela', 'Tela'], ['chip', 'Chip'], ['camera', 'Câmera'], ['bateria', 'Bateria']].map(([campo, label]) => <label key={campo}>{label}<input value={form.specs?.[campo] || ''} onChange={e => setForm({ ...form, specs: { ...form.specs, [campo]: e.target.value } })} /></label>)}
    </div>
    {form.variants.map((v, indice) => <div className="variant-editor-row" key={v._id}>
      <label>Cor<input required value={v.cor} onChange={e => alterar(indice, 'cor', e.target.value)} /></label>
      <label>Capacidade<input required value={v.capacidade} onChange={e => alterar(indice, 'capacidade', e.target.value)} /></label>
      <label>SKU<input required value={v.sku} onChange={e => alterar(indice, 'sku', e.target.value)} /></label>
      <label>Custo (R$)<input type="number" min="0.01" step="0.01" value={v.precoCusto ?? ''} onChange={e => alterar(indice, 'precoCusto', e.target.value)} /></label>
      <label>Venda (R$)<input required type="number" min="0.01" step="0.01" value={v.preco} onChange={e => alterar(indice, 'preco', e.target.value)} /></label>
      <label>Estoque / sob encomenda<input type="number" min="0" step="1" placeholder="Sob encomenda" value={v.estoque ?? ''} onChange={e => alterar(indice, 'estoque', e.target.value)} /></label>
      <label>Disponível<input type="checkbox" checked={v.disponivel !== false} onChange={e => alterar(indice, 'disponivel', e.target.checked)} style={{ width: 20 }} /></label>
      <label style={{ flexBasis: '100%' }}>Imagens (uma URL por linha)<textarea value={(v.imagens || []).join('\n')} onChange={e => alterar(indice, 'imagens', e.target.value.split('\n'))} style={{ background: '#151515', color: '#f7f7f3', padding: 12, borderRadius: 12 }} /></label>
    </div>)}
    <label><input type="checkbox" checked={form.disponivel !== false} onChange={e => setForm({ ...form, disponivel: e.target.checked })} /> Modelo disponível no catálogo</label>
    {erro && <p className="variant-error" role="alert">{erro}</p>}
    <div className="variant-options" style={{ marginTop: 20 }}><button type="button" className="variant-clear" disabled={salvando} onClick={onClose}>Cancelar</button><button type="submit" className="variant-clear" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar variantes'}</button></div>
  </form>;
}
