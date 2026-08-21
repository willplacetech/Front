import { useState } from 'react';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import { 
  ArrowDownTrayIcon, CheckIcon, ExclamationTriangleIcon, 
  LinkIcon, PhotoIcon, CurrencyDollarIcon, TagIcon
} from '@heroicons/react/24/outline';

// CORES OFICIAIS PLACETECH
const AZUL = '#3483FA';
const VERDE = '#00A650';
const VERMELHO = '#EF4444';

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
      setSucesso('✅ Dados extraídos! Confira abaixo e salve.');
      setModo('form');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao extrair dados');
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
      setErro(err.response?.data?.error || 'Erro ao salvar produto');
    }
  };

  return (
    <LayoutAdmin 
      loading={carregando}
      titulo="Novo Produto"
      subtitulo="Importe via link ou cadastre manualmente"
    >
      {/* ⚠️ MENSAGEM DE ERRO */}
      {erro && (
        <div style={{
          padding: '16px 20px', marginBottom: '24px',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <ExclamationTriangleIcon style={{width: '20px', height: '20px', color: VERMELHO, flexShrink: 0, marginTop: '2px'}} />
          <p style={{color: '#B91C1C', fontWeight: 500, margin: 0}}>{erro}</p>
        </div>
      )}

      {/* ✅ MENSAGEM DE SUCESSO */}
      {sucesso && (
        <div style={{
          padding: '16px 20px', marginBottom: '24px',
          backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <CheckIcon style={{width: '20px', height: '20px', color: VERDE, flexShrink: 0, marginTop: '2px'}} />
          <p style={{color: '#166534', fontWeight: 600, margin: 0}}>{sucesso}</p>
        </div>
      )}

      {/* 🔘 ABAS DE NAVEGAÇÃO */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
        <button 
          onClick={() => setModo('link')}
          style={{
            padding: '12px 24px', borderRadius: '12px', border: 'none',
            backgroundColor: modo === 'link' ? AZUL : 'white',
            color: modo === 'link' ? 'white' : '#555',
            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            boxShadow: modo === 'link' ? '0 2px 8px rgba(52,131,250,0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <LinkIcon style={{width: '16px', height: '16px'}} />
            Por Link
          </span>
        </button>
        <button 
          onClick={() => setModo('form')}
          style={{
            padding: '12px 24px', borderRadius: '12px', border: 'none',
            backgroundColor: modo === 'form' ? AZUL : 'white',
            color: modo === 'form' ? 'white' : '#555',
            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            boxShadow: modo === 'form' ? '0 2px 8px rgba(52,131,250,0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          ✍️ Manual
        </button>
      </div>

      {/* 🔗 ABA: POR LINK */}
      {modo === 'link' && (
        <form onSubmit={extrair} style={{
          backgroundColor: AZUL, padding: '32px', borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(52,131,250,0.15)', marginBottom: '24px'
        }}>
          <h3 style={{color: 'white', fontSize: '20px', fontWeight: 700, margin: '0 0 '}}>
            Passo 1: Cole o link do produto
          </h3>
          <p style={{color: 'rgba(255,255,255,0.8)', margin: '8px 0 24px 0', fontSize: '14px'}}>
            Funciona com QUALQUER loja: Mercado Livre, Amazon, Magazine, Netshoes, etc.
          </p>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            <div style={{flex: 1, minWidth: '300px', position: 'relative'}}>
              <LinkIcon style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                width: '20px', height: '20px', color: '#999'
              }} />
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://www.mercadolivre.com.br/..."
                style={{
                  width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px',
                  border: 'none', fontSize: '15px', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '16px 32px', backgroundColor: 'white', color: AZUL,
                border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseOver={e => e.target.style.backgroundColor = '#F0F4FF'}
              onMouseOut={e => e.target.style.backgroundColor = 'white'}
            >
              EXTRAIR DADOS
            </button>
          </div>
        </form>
      )}

      {/* 📝 ABA: FORMULÁRIO MANUAL / EXTRAÍDO */}
      {modo === 'form' && (
        <form onSubmit={salvar} style={{
          backgroundColor: 'white', padding: '32px', borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #eee'
        }}>
          <h3 style={{
            fontSize: '18px', fontWeight: 700, color: '#333',
            margin: '0 0 24px 0', paddingBottom: '12px', borderBottom: '1px solid #eee'
          }}>
            Dados do Produto
          </h3>

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px'}}>
              <TagIcon style={{width: '14px', height: '14px', display: 'inline', marginRight: '6px'}} />
              Nome *
            </label>
            <input
              required
              value={produto.nome}
              onChange={e => setProduto({...produto, nome: e.target.value})}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                boxSizing: 'border-box', transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = AZUL}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
            <div>
              <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px'}}>
                <CurrencyDollarIcon style={{width: '14px', height: '14px', display: 'inline', marginRight: '6px'}} />
                Preço (R$) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={produto.preco}
                onChange={e => setProduto({...produto, preco: e.target.value})}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                  boxSizing: 'border-box', transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = AZUL}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>
            <div>
              <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px'}}>
                Categoria
              </label>
              <input
                value={produto.categoria}
                onChange={e => setProduto({...produto, categoria: e.target.value})}
                placeholder="Ex: Eletrônicos"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                  boxSizing: 'border-box', transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = AZUL}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>
          </div>

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px'}}>
              <PhotoIcon style={{width: '14px', height: '14px', display: 'inline', marginRight: '6px'}} />
              URL da Imagem
            </label>
            <input
              value={produto.imagem}
              onChange={e => setProduto({...produto, imagem: e.target.value})}
              placeholder="https://..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                boxSizing: 'border-box', transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = AZUL}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            {produto.imagem && (
              <div style={{marginTop: '12px'}}>
                <img 
                  src={produto.imagem} 
                  alt="Pré-visualização"
                  style={{
                    width: '112px', height: '112px', objectFit: 'contain',
                    borderRadius: '10px', border: '1px solid #eee', padding: '8px', backgroundColor: '#fafafa'
                  }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px'}}>
              Descrição
            </label>
            <textarea
              value={produto.descricao}
              onChange={e => setProduto({...produto, descricao: e.target.value})}
              placeholder="Descrição do produto..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', minHeight: '100px',
                outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s', resize: 'vertical'
              }}
              onFocus={e => e.target.style.borderColor = AZUL}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{display: 'flex', gap: '12px'}}>
            <button
              type="submit"
              style={{
                flex: 1, padding: '14px 24px', backgroundColor: VERDE,
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.target.style.backgroundColor = '#008C45'}
              onMouseOut={e => e.target.style.backgroundColor = VERDE}
            >
              <ArrowDownTrayIcon style={{width: '18px', height: '18px'}} />
              💾 Salvar Produto
            </button>
            <button
              type="button"
              onClick={() => { setModo('link'); setProduto({ nome: '', preco: '', imagem: '', categoria: '', descricao: '' }); setErro(''); setSucesso(''); }}
              style={{
                padding: '14px 24px', backgroundColor: 'white', color: '#666',
                border: '1px solid #ddd', borderRadius: '12px',
                fontSize: '15px', fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseOut={e => e.target.style.backgroundColor = 'white'}
            >
              Voltar
            </button>
          </div>
        </form>
      )}
    </LayoutAdmin>
  );
}