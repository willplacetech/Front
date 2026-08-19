import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';

// CORES OFICIAIS
const AMARELO = '#F9D828';
const AZUL = '#3483FA';
const VERDE = '#00A650';
const VERMELHO = '#EF4444';
const CINZA = '#F5F5F5';

// ✅ ESTRUTURA PADRÃO DE UM PRODUTO
const produtoVazio = () => ({
  nome: '',
  preco: '',
  precoPersonalizado: '',
  categoria: '',
  imagem: '',
  descricao: '',
  disponivel: true
});

export default function ProdutosCrud() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // ✅ LISTA DE NOVOS PRODUTOS PARA CADASTRAR
  const [listaNovos, setListaNovos] = useState([produtoVazio()]);

  // Carregar produtos
  useEffect(() => { carregar(); }, []);
  const carregar = () => {
    setLoading(true);
    api.get('/produtos').then(r => { setProdutos(r.data); })
      .finally(() => setLoading(false));
  };

  // ✅ ADICIONA UMA NOVA LINHA NA LISTA
  const adicionarLinha = () => {
    setListaNovos([...listaNovos, produtoVazio()]);
  };

  // ✅ REMOVE UMA LINHA DA LISTA
  const removerLinha = (indice) => {
    if (listaNovos.length === 1) return;
    setListaNovos(listaNovos.filter((_, i) => i !== indice));
  };

  // ✅ ATUALIZA OS DADOS DE UMA LINHA
  const alterarLinha = (indice, campo, valor) => {
    const novaLista = [...listaNovos];
    novaLista[indice][campo] = valor;
    setListaNovos(novaLista);
  };

  // ✅ SALVA TODOS OS PRODUTOS DE UMA VEZ
  const salvarTodos = async (e) => {
    e.preventDefault();

    // 🛡️ VALIDAÇÃO
    const invalidos = listaNovos.filter(p => !p.nome.trim() || !p.preco);
    if (invalidos.length > 0) {
      alert(`⚠️ Preencha Nome e Preço em todos os produtos! (${invalidos.length} sem dados)`);
      return;
    }

    setSalvando(true);

    try {
      // 🔄 Faz todas as requisições em paralelo
      const promessas = listaNovos.map(produto => {
        const dados = {
          ...produto,
          preco: Number(produto.preco),
          precoPersonalizado: produto.precoPersonalizado ? Number(produto.precoPersonalizado) : undefined
        };
        return api.post('/produtos', dados);
      });

      await Promise.all(promessas);

      // ✅ SUCESSO
      alert(`✅ ${listaNovos.length} produto(s) cadastrado(s) com sucesso!`);
      setListaNovos([produtoVazio()]); // Limpa a lista
      setMostrarForm(false);
      carregar(); // Recarrega a tabela

    } catch (erro) {
      console.error(erro);
      alert('❌ Erro ao cadastrar um ou mais produtos!');
    } finally {
      setSalvando(false);
    }
  };

  // Editar e Excluir continuam funcionando para produtos individuais
  const [editando, setEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState(produtoVazio());

  const editar = (p) => {
    setFormEdicao({ ...p });
    setEditando(p);
    setMostrarForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvarEdicao = (e) => {
    e.preventDefault();
    const dados = {
      ...formEdicao,
      preco: Number(formEdicao.preco),
      precoPersonalizado: formEdicao.precoPersonalizado ? Number(formEdicao.precoPersonalizado) : undefined
    };
    api.put(`/produtos/${editando._id}`, dados)
      .then(() => {
        setEditando(null);
        setFormEdicao(produtoVazio());
        carregar();
      });
  };

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
    <LayoutAdmin titulo="Produtos" subtitulo="Cadastrar vários produtos de uma vez">
      
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
          onClick={() => {
            setMostrarForm(!mostrarForm);
            setEditando(null);
            setListaNovos([produtoVazio()]);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            backgroundColor: AZUL, color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.target.style.backgroundColor = '#2968D3'}
          onMouseOut={e => e.target.style.backgroundColor = AZUL}
        >
          <PlusIcon style={{width: '18px', height: '18px'}} />
          {mostrarForm ? 'Fechar' : 'Cadastrar em Lote'}
        </button>
      </div>

      {/* 📝 FORMULÁRIO DE VÁRIOS PRODUTOS */}
      {mostrarForm && (
        <form onSubmit={salvarTodos} style={{
          backgroundColor: 'white', padding: '24px', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px'
        }}>
          <h3 style={{fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '1px solid #eee'}}>
            📦 Cadastrar Vários Produtos — {listaNovos.length} produto(s) na lista
          </h3>

          {/* ✅ LISTA DINÂMICA DE PRODUTOS */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {listaNovos.map((produto, indice) => (
              <div key={indice} style={{
                border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px',
                backgroundColor: '#FAFAFA'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                  <span style={{fontWeight: 600, fontSize: '14px', color: '#444'}}>Produto #{indice + 1}</span>
                  {listaNovos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerLinha(indice)}
                      style={{border: 'none', background: 'transparent', color: VERMELHO, cursor: 'pointer', padding: '4px'}}
                    >
                      <XMarkIcon style={{width: '18px', height: '18px'}} />
                    </button>
                  )}
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px'}}>
                  <div style={{gridColumn: '1 / -1'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px'}}>Nome *</label>
                    <input
                      required
                      placeholder="Nome do produto"
                      value={produto.nome}
                      onChange={e => alterarLinha(indice, 'nome', e.target.value)}
                      style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px'}}
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px'}}>Preço R$ *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produto.preco}
                      onChange={e => alterarLinha(indice, 'preco', e.target.value)}
                      style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px'}}
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px'}}>Seu Preço (opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={produto.precoPersonalizado}
                      onChange={e => alterarLinha(indice, 'precoPersonalizado', e.target.value)}
                      style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px'}}
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px'}}>Categoria</label>
                    <input
                      placeholder="Ex: Eletrônicos"
                      value={produto.categoria}
                      onChange={e => alterarLinha(indice, 'categoria', e.target.value)}
                      style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px'}}
                    />
                  </div>

                  <div style={{gridColumn: '1 / -1'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px'}}>URL da Imagem</label>
                    <input
                      placeholder="https://..."
                      value={produto.imagem}
                      onChange={e => alterarLinha(indice, 'imagem', e.target.value)}
                      style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px'}}
                    />
                  </div>

                  <div style={{gridColumn: '1 / -1'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px'}}>Descrição</label>
                    <textarea
                      placeholder="Descrição do produto"
                      value={produto.descricao}
                      onChange={e => alterarLinha(indice, 'descricao', e.target.value)}
                      style={{width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '60px'}}
                    />
                  </div>

                  <label style={{gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={produto.disponivel ?? true}
                      onChange={e => alterarLinha(indice, 'disponivel', e.target.checked)}
                      style={{width: '16px', height: '16px', accentColor: AZUL}}
                    />
                    <span style={{fontSize: '13px'}}>Disponível no catálogo</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* ➕ ADICIONAR MAIS LINHAS */}
          <button
            type="button"
            onClick={adicionarLinha}
            style={{
              marginTop: '16px', padding: '10px 20px', backgroundColor: CINZA,
              color: '#333', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%'
            }}
          >
            ➕ Adicionar Outro Produto na Lista
          </button>

          {/* 💾 SALVAR TODOS */}
          <button
            type="submit"
            disabled={salvando}
            style={{
              marginTop: '20px', padding: '14px', backgroundColor: salvando ? '#888' : VERDE,
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer',
              width: '100%', transition: 'background 0.2s'
            }}
            onMouseOver={e => !salvando && (e.target.style.backgroundColor = '#008C45')}
            onMouseOut={e => !salvando && (e.target.style.backgroundColor = VERDE)}
          >
            {salvando ? '⏳ Cadastrando...' : `💾 Salvar Todos os ${listaNovos.length} Produtos`}
          </button>
        </form>
      )}

      {/* ✏️ FORMULÁRIO DE EDIÇÃO INDIVIDUAL */}
      {editando && (
        <form onSubmit={salvarEdicao} style={{
          backgroundColor: 'white', padding: '24px', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px'
        }}>
          <h3 style={{fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0'}}>✏️ Editar Produto</h3>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div style={{gridColumn: '1 / -1'}}>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Nome *</label>
              <input
                required
                value={formEdicao.nome}
                onChange={e => setFormEdicao({...formEdicao, nome: e.target.value})}
                style={{width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px'}}
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Preço Base R$ *</label>
              <input
                required type="number" step="0.01"
                value={formEdicao.preco}
                onChange={e => setFormEdicao({...formEdicao, preco: e.target.value})}
                style={{width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px'}}
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Seu Preço R$</label>
              <input
                type="number" step="0.01"
                value={formEdicao.precoPersonalizado || ''}
                onChange={e => setFormEdicao({...formEdicao, precoPersonalizado: e.target.value})}
                style={{width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px'}}
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Categoria</label>
              <input
                value={formEdicao.categoria}
                onChange={e => setFormEdicao({...formEdicao, categoria: e.target.value})}
                style={{width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px'}}
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Imagem URL</label>
              <input
                value={formEdicao.imagem}
                onChange={e => setFormEdicao({...formEdicao, imagem: e.target.value})}
                style={{width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px'}}
              />
            </div>
            <div style={{gridColumn: '1 / -1'}}>
              <label style={{display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px'}}>Descrição</label>
              <textarea
                value={formEdicao.descricao}
                onChange={e => setFormEdicao({...formEdicao, descricao: e.target.value})}
                style={{width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px'}}
              />
            </div>
            <label style={{gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input
                type="checkbox"
                checked={formEdicao.disponivel ?? true}
                onChange={e => setFormEdicao({...formEdicao, disponivel: e.target.checked})}
                style={{width: '18px', height: '18px'}}
              />
              <span>Disponível no catálogo</span>
            </label>
          </div>

          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button
              type="button"
              onClick={() => {setEditando(null); setFormEdicao(produtoVazio());}}
              style={{padding: '12px 24px', backgroundColor: CINZA, border: 'none', borderRadius: '10px', cursor: 'pointer'}}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{padding: '12px 24px', backgroundColor: VERDE, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600}}
            >
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* 📋 TABELA — CONTINUA IGUAL */}
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