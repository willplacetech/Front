import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';

// CORES OFICIAIS
const AMARELO = '#F9D828';
const AZUL = '#3483FA';
const VERDE = '#00A650';
const VERMELHO = '#EF4444';
const CINZA = '#F5F5F5';

export default function ProdutosCrud() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  
  const vazio = { nome: '', preco: '', precoPersonalizado: '', categoria: '', imagem: '', descricao: '', disponivel: true };
  const [form, setForm] = useState(vazio);

  // Carregar produtos
  useEffect(() => { carregar(); }, []);
  const carregar = () => {
    setLoading(true);
    api.get('/produtos').then(r => { setProdutos(r.data); })
      .finally(() => setLoading(false));
  };

  // Salvar
  const salvar = (e) => {
    e.preventDefault();
    const dados = { ...form, preco: Number(form.preco), precoPersonalizado: form.precoPersonalizado ? Number(form.precoPersonalizado) : undefined };
    editando ? api.put(`/produtos/${editando._id}`, dados) : api.post('/produtos', dados);
    setForm(vazio); setEditando(null); setMostrarForm(false); carregar();
  };

  // Editar
  const editar = (p) => {
    setForm({ ...p });
    setEditando(p);
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Excluir
  const deletar = (id) => {
    if (confirm('Excluir este produto?')) {
      api.delete(`/produtos/${id}`).then(carregar);
    }
  };

  // Filtrar
  const produtosFiltrados = filtro 
    ? produtos.filter(p => Object.values(p).join(' ').toLowerCase().includes(filtro.toLowerCase()))
    : produtos;

  return (
    <LayoutAdmin titulo="Produtos" subtitulo="Gerenciar produtos cadastrados">
      
      {/* 🔍 FILTRO + BOTÃO NOVO */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px'}}>
        <div style={{position: 'relative', flex: 1, maxWidth: '420px'}}>
          <MagnifyingGlassIcon style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '18px', height: '18px', color: '#888'
          }} />
          <input
            placeholder="Filtrar produtos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
              border: '1px solid #ddd', fontSize: '15px', outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = AZUL}
            onBlur={e => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <button
          onClick={() => { setForm(vazio); setEditando(null); setMostrarForm(!mostrarForm); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            backgroundColor: AZUL, color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.target.style.backgroundColor = '#2968D3'}
          onMouseOut={e => e.target.style.backgroundColor = AZUL}
        >
          <PlusIcon style={{width: '18px', height: '18px'}} />
          {mostrarForm ? 'Fechar' : 'Novo Produto'}
        </button>
      </div>

      {/* 📝 FORMULÁRIO */}
      {mostrarForm && (
        <form onSubmit={salvar} style={{
          backgroundColor: 'white', padding: '24px', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
        }}>
          <h3 style={{gridColumn: '1 / -1', fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee'}}>
            {editando ? 'Editar Produto' : 'Novo Produto'}
          </h3>

          {[
            { key: 'nome', label: 'Nome do Produto', required: true, col: '1 / -1' },
            { key: 'preco', label: 'Preço Base (R$)', type: 'number', step: '0.01', required: true },
            { key: 'precoPersonalizado', label: 'Seu Preço (opcional)', type: 'number', step: '0.01' },
            { key: 'categoria', label: 'Categoria' },
            { key: 'imagem', label: 'URL da Imagem' },
          ].map(f => (
            <div key={f.key} style={{gridColumn: f.col || 'span 1'}}>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>{f.label}</label>
              <input
                required={f.required}
                type={f.type || 'text'}
                step={f.step}
                placeholder={f.label}
                value={form[f.key] || ''}
                onChange={e => setForm({...form, [f.key]: e.target.value})}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid #ddd', fontSize: '14px', outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = AZUL}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>
          ))}

          <div style={{gridColumn: '1 / -1'}}>
            <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Descrição</label>
            <textarea
              placeholder="Descrição do produto"
              value={form.descricao || ''}
              onChange={e => setForm({...form, descricao: e.target.value})}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '14px', minHeight: '80px',
                outline: 'none', transition: 'border 0.2s', resize: 'vertical'
              }}
              onFocus={e => e.target.style.borderColor = AZUL}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <label style={{gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 0'}}>
            <input
              type="checkbox"
              checked={form.disponivel ?? true}
              onChange={e => setForm({...form, disponivel: e.target.checked})}
              style={{width: '18px', height: '18px', accentColor: AZUL}}
            />
            <span style={{fontSize: '14px', fontWeight: 500}}>Disponível no catálogo</span>
          </label>

          <button
            type="submit"
            style={{
              gridColumn: '1 / -1', padding: '12px', backgroundColor: VERDE,
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#008C45'}
            onMouseOut={e => e.target.style.backgroundColor = VERDE}
          >
            💾 Salvar Produto
          </button>
        </form>
      )}

      {/* 📋 TABELA */}
      {loading ? (
        <div style={{padding: '60px', textAlign: 'center'}}>
          <div style={{width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: AZUL, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto'}} />
          <p style={{marginTop: '12px', color: '#666'}}>Carregando produtos...</p>
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
                  {['Foto', 'Produto', 'Preço', 'Categoria', 'Status', 'Ações'].map((h,i) => (
                    <th key={i} style={{
                      padding: '14px 16px', textAlign: i===5 ? 'right' : 'left',
                      fontSize: '13px', fontWeight: 600, color: '#444', textTransform: 'uppercase'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{padding: '60px 20px', textAlign: 'center', color: '#999'}}>
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : produtosFiltrados.map(p => {
                  const preco = p.precoPersonalizado || p.preco;
                  return (
                    <tr key={p._id} style={{borderTop: '1px solid #f0f0f0', transition: 'background 0.15s'}}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{padding: '12px 16px'}}>
                        {p.imagem ? (
                          <img src={p.imagem} alt={p.nome} style={{width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#f8f8f8'}} />
                        ) : (
                          <div style={{width: '48px', height: '48px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'}}>📦</div>
                        )}
                      </td>
                      <td style={{padding: '12px 16px', fontWeight: 500}}>{p.nome}</td>
                      <td style={{padding: '12px 16px'}}>
                        <div style={{fontWeight: 700, fontSize: '15px', color: AZUL}}>R$ {Number(preco).toFixed(2)}</div>
                        {p.precoPersonalizado && (
                          <div style={{fontSize: '12px', color: '#999', textDecoration: 'line-through'}}>De R$ {Number(p.preco).toFixed(2)}</div>
                        )}
                      </td>
                      <td style={{padding: '12px 16px', color: '#555'}}>{p.categoria || '-'}</td>
                      <td style={{padding: '12px 16px'}}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: p.disponivel ? `${VERDE}15` : `${VERMELHO}15`,
                          color: p.disponivel ? VERDE : VERMELHO
                        }}>
                          {p.disponivel ? '✅ Ativo' : '⏸️ Inativo'}
                        </span>
                      </td>
                      <td style={{padding: '12px 16px', textAlign: 'right'}}>
                        <button onClick={() => editar(p)} style={{
                          padding: '6px 10px', border: 'none', background: `${AZUL}10`,
                          color: AZUL, borderRadius: '8px', marginRight: '6px', cursor: 'pointer'
                        }} title="Editar">
                          <PencilIcon style={{width: '14px', height: '14px'}} />
                        </button>
                        <button onClick={() => deletar(p._id)} style={{
                          padding: '6px 10px', border: 'none', background: `${VERMELHO}10`,
                          color: VERMELHO, borderRadius: '8px', cursor: 'pointer'
                        }} title="Excluir">
                          <TrashIcon style={{width: '14px', height: '14px'}} />
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </LayoutAdmin>
  );
}