import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useCarrinho } from '../context/carrinho';
import Carrinho from '../components/carrinho';
import ImagemProduto from '../components/ImagemProduto';
import '../components/Variantes.css';
import { itemDaVariante, moeda, ordenarCapacidades, varianteDisponivel } from '../utils/variantes';

const CORES = {
  'Prata': '#cbd0d5', 'Deep Blue': '#243952', 'Cosmic Orange': '#d9763c',
  'Titânio Natural': '#aaa296', 'Titânio Deserto': '#c9ac91', 'Titânio Preto': '#363536',
  'Titânio Branco': '#e9e5e0', 'Titânio Azul': '#4b5970', 'Preto': '#292929', 'Branco': '#eee',
  'Azul': '#5d92c3', 'Verde': '#779681', 'Rosa': '#e2b8c7', 'Roxo': '#9481b1',
  'Dourado': '#cdb57f', 'Cinza': '#83878e', 'Vermelho': '#bb4347', 'Amarelo': '#dbcf80',
  'Meia-noite': '#282c38', 'Estelar': '#ded7c8', 'Laranja': '#e9863c',
  'Dourado Claro': '#e5d8ba', 'Verde Sage': '#bcc7b2', 'Preto Jateado': '#252527',
  'Cinza Espacial': '#64666b', 'Azul Céu': '#a7c2dc', 'Azul Índigo': '#495379'
};

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const query = params.toString();
  const [resultado, setResultado] = useState({ id: '', produto: null, erro: '' });
  const [cor, setCor] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [imagemAtiva, setImagemAtiva] = useState('');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [aviso, setAviso] = useState('');
  const { itens, adicionar } = useCarrinho();

  useEffect(() => {
    const controle = new AbortController();
    api.get(`/produtos/${id}`, { signal: controle.signal }).then(({ data }) => {
      const preferencias = new URLSearchParams(query);
      const disponiveis = data.variants.filter(varianteDisponivel);
      const inicial = disponiveis.find(v => (!preferencias.get('cor') || v.cor === preferencias.get('cor')) &&
        (!preferencias.get('capacidade') || v.capacidade === preferencias.get('capacidade'))) || disponiveis[0] || data.variants[0];
      setResultado({ id, produto: data, erro: '' });
      setCor(inicial?.cor || '');
      setCapacidade(inicial?.capacidade || '');
      setImagemAtiva('');
    }).catch(erro => {
      if (!controle.signal.aborted) setResultado({ id, produto: null, erro: erro.response?.data?.error || 'Não foi possível carregar o produto.' });
    });
    return () => controle.abort();
  }, [id, query]);

  const produto = resultado.id === id ? resultado.produto : null;
  const variante = produto?.variants.find(v => v.cor === cor && v.capacidade === capacidade);
  const cores = [...new Set(produto?.variants.map(v => v.cor) || [])];
  const capacidades = ordenarCapacidades([...new Set(produto?.variants.map(v => v.capacidade) || [])]);
  const imagens = variante?.imagens?.length ? variante.imagens : [produto?.imagem].filter(Boolean);
  const imagem = imagens.includes(imagemAtiva) ? imagemAtiva : imagens[0];
  const quantidadeNoCarrinho = itens.find(item => item._id === `${produto?._id}:${variante?._id}`)?.quantidade || 0;
  const podeAdicionar = variante && varianteDisponivel(variante) &&
    (variante.estoque === null || variante.estoque === undefined || quantidadeNoCarrinho < variante.estoque);
  const voltar = `/${query ? `?${query}` : ''}#catalogo`;

  const escolherCor = valor => {
    const opcoes = produto.variants.filter(v => v.cor === valor);
    const proxima = opcoes.find(v => v.capacidade === capacidade && varianteDisponivel(v)) || opcoes.find(varianteDisponivel) || opcoes[0];
    setCor(valor);
    setCapacidade(proxima.capacidade);
    setAviso('');
    setImagemAtiva('');
  };

  const comprar = () => {
    if (!podeAdicionar) return;
    adicionar(itemDaVariante(produto, variante));
    setAviso(`${cor} · ${capacidade} adicionado ao carrinho.`);
  };

  return <div className="variant-page"><div className="variant-page-inner">
    <nav className="variant-nav" aria-label="Navegação do produto">
      <Link to={voltar}>← Voltar ao catálogo</Link>
      <button onClick={() => setCarrinhoAberto(true)}>Carrinho ({itens.reduce((total, item) => total + item.quantidade, 0)})</button>
    </nav>
    {!produto ? <p className="variant-status" role="status">{resultado.id === id && resultado.erro ? resultado.erro : 'Carregando modelo...'}</p> :
      <main className="variant-detail">
        <div className="variant-gallery">
          <ImagemProduto className="variant-main-image" src={imagem} alt={`${produto.nome} ${cor}`} />
          {imagens.length > 1 && <div className="variant-thumbs">{imagens.map((src, indice) => <button key={`${src}-${indice}`} onClick={() => setImagemAtiva(src)} aria-label={`Ver imagem ${indice + 1}`} aria-pressed={src === imagem}>
            <ImagemProduto src={src} alt={`${produto.nome}, imagem ${indice + 1}`} />
          </button>)}</div>}
        </div>
        <div>
          <span className="variant-eyebrow">{produto.marca} · {produto.categoria}</span>
          <h1>{produto.nome}</h1>
          <p className="variant-description">{produto.descricao || 'Escolha sua cor e capacidade. Atendimento especializado e suporte Placetech.'}</p>
          <fieldset className="variant-choices"><legend>Cor: {cor}</legend>
            <div className="variant-options">{cores.map(valor => <button type="button" key={valor} className="variant-option" aria-pressed={cor === valor}
              disabled={!produto.variants.some(v => v.cor === valor && varianteDisponivel(v))} onClick={() => escolherCor(valor)}>
              <span className="variant-swatch" aria-hidden="true" style={{ background: CORES[valor] || 'linear-gradient(135deg,#777,#bbb)' }} />{valor}
            </button>)}</div>
          </fieldset>
          <fieldset className="variant-choices"><legend>Capacidade</legend>
            <div className="variant-options">{capacidades.map(valor => <button type="button" key={valor} className="variant-option" aria-pressed={capacidade === valor}
              disabled={!produto.variants.some(v => v.cor === cor && v.capacidade === valor && varianteDisponivel(v))}
              onClick={() => { setCapacidade(valor); setAviso(''); setImagemAtiva(''); }}>{valor}</button>)}</div>
          </fieldset>
          <div aria-live="polite">
            <p className="variant-price">{variante ? moeda(variante.preco) : 'Selecione uma variante'}</p>
            <div className="variant-meta">
              <span>{variante && varianteDisponivel(variante) ? variante.estoque === null || variante.estoque === undefined ? 'Sob encomenda · consulte o prazo de entrega' : `${variante.estoque} unidade(s) em estoque` : 'Combinação indisponível'}</span>
              {variante && <span>SKU: {variante.sku}</span>}
            </div>
          </div>
          <button className="variant-buy" disabled={!podeAdicionar} onClick={comprar}>{podeAdicionar ? 'Adicionar ao carrinho →' : 'Indisponível para adicionar'}</button>
          <p className="variant-feedback" role="status">{aviso}</p>
          <section className="variant-specs"><h2>Especificações</h2><dl>
            {[['tela', 'Tela'], ['chip', 'Chip'], ['camera', 'Câmera'], ['bateria', 'Bateria']].map(([campo, label]) => <div key={campo}><dt>{label}</dt><dd>{produto.specs?.[campo] || (campo === 'camera' && produto.specs?.['câmera']) || 'Consulte nossa equipe'}</dd></div>)}
          </dl></section>
        </div>
      </main>}
    <Carrinho aberto={carrinhoAberto} fechar={() => setCarrinhoAberto(false)} />
  </div></div>;
}
