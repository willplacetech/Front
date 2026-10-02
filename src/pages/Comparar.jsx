import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, ArrowsRightLeftIcon, CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuth } from '../context/auth';
import { useCarrinho } from '../context/carrinho';
import ImagemProduto from '../components/ImagemProduto';
import SeletorVariantes from '../components/SeletorVariantes';
import { itemDaVariante, moeda, varianteDisponivel } from '../utils/variantes';
import { PASSOS_COMPARAR, SPECS_COMPARAR, camposDiferentes, creditoDaTroca, diferencaDeUpgrade,
  lembrarTroca, specDoProduto, tokenDaTroca, ultimaTroca, valorFinal } from '../utils/comparar';
import './Comparar.css';

const TITULOS = ['Seu aparelho', 'Escolha até 2 aparelhos da loja', 'Seu próximo upgrade, lado a lado.'];
const TEXTOS = ['Comece pelo aparelho que está com você. Sua troca cadastrada já aparece aqui.',
  'Encontre seus favoritos e escolha a cor e a capacidade de cada um.',
  'Veja o que muda e quanto falta para chegar ao seu próximo aparelho.'];

function CartaoComparacao({ aparelho, atual, diferencas, credito, troca, onComprar, bloqueado }) {
  const upgrade = atual ? diferencaDeUpgrade(atual, aparelho) : null;
  const preco = aparelho.variante?.preco;
  return <article className={`comparar-card ${atual ? 'comparar-card-loja' : 'comparar-card-atual'}`} aria-label={aparelho.nome}>
    <span className="comparar-tag">{atual ? 'SEU PRÓXIMO APARELHO' : 'SEU APARELHO'}</span>
    <div className="comparar-foto"><ImagemProduto src={aparelho.imagem} alt={aparelho.nome} /></div>
    <h3>{aparelho.nome}</h3>
    <dl className="comparar-dados">
      {[['capacidade', 'Capacidade'], ['cor', 'Cor']].map(([campo, label]) => <div key={campo}
        className={diferencas.has(campo) ? 'comparar-diferenca' : ''}><dt>{label}</dt><dd>{aparelho[campo]}</dd></div>)}
    </dl>
    <div className="comparar-valores">
      <dl>
        <div><dt>Preço à vista</dt><dd>{atual ? moeda(preco) : '—'}</dd></div>
        <div><dt>Valor da troca</dt><dd>{credito !== null ? moeda(credito) : troca ? 'Em avaliação' : 'Sem oferta'}</dd></div>
        <div className="comparar-final"><dt>{atual ? 'Valor final com a troca' : 'Seu crédito de troca'}</dt>
          <dd>{atual ? moeda(valorFinal(preco, credito)) : credito !== null ? moeda(credito) : 'Em avaliação'}</dd></div>
      </dl>
      {atual && credito === null && <p>{troca ? 'Preço sem desconto enquanto sua troca está em avaliação.' : 'Cadastre sua troca para receber uma oferta.'}</p>}
      {!atual && <p className="comparar-estado">{aparelho.descricaoEstado || 'Estado não descrito.'}</p>}
    </div>
    <dl className="comparar-specs">{SPECS_COMPARAR.map(([campo, label]) => <div key={campo}
      className={diferencas.has(campo) ? 'comparar-diferenca' : ''}>
      <dt>{label}{diferencas.has(campo) && <span className="comparar-indicador">Diferente</span>}</dt>
      <dd>{specDoProduto(aparelho.produto, campo) || 'Não informado'}</dd>
    </div>)}</dl>
    {upgrade ? <div className="comparar-upgrade" style={{ '--upgrade': `${upgrade.percentual}%` }}>
      <div><strong>O que muda no upgrade</strong><span>{upgrade.diferentes}/{upgrade.conhecidos}</span></div>
      <div className="comparar-upgrade-track" role="meter" aria-label={`Diferenças de ${aparelho.nome}`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={upgrade.percentual}
        aria-valuetext={`${upgrade.diferentes} diferenças em ${upgrade.conhecidos} características conhecidas`}><span /></div>
      <p>{upgrade.conhecidos ? `${upgrade.diferentes} diferenças nas características conhecidas.` : 'Faltam informações para medir as diferenças.'}</p>
      <button className="comparar-button comparar-primary" disabled={bloqueado} onClick={onComprar}>Quero este com a troca <ArrowRightIcon /></button>
    </div> : <p className="comparar-credit-note">O crédito é aplicado uma vez ao pedido. A oferta depende da avaliação do seu aparelho.</p>}
  </article>;
}

export default function Comparar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token, carregandoUsuario } = useAuth();
  const { itens, adicionar, associarTroca } = useCarrinho();
  const [catalogo, setCatalogo] = useState({ produtos: [], carregando: true, erro: '' });
  const [solicitacao, setSolicitacao] = useState({ id: '', troca: null, erro: '' });
  const [minhas, setMinhas] = useState({ token: '', trocas: [] });
  const [busca, setBusca] = useState('');
  const [buscaMeu, setBuscaMeu] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [aviso, setAviso] = useState('');
  const titulo = useRef(null);
  const finalizando = useRef(false);
  const tradeInId = params.get('tradeInId') || '';
  const temEscolhaManual = params.has('meu');

  useEffect(() => {
    const controle = new AbortController();
    api.get('/produtos', { signal: controle.signal }).then(({ data }) => {
      setCatalogo({ produtos: data, carregando: false, erro: '' });
    }).catch(error => {
      if (!controle.signal.aborted) setCatalogo({ produtos: [], carregando: false,
        erro: error.response?.data?.error || 'Não foi possível carregar o catálogo.' });
    });
    return () => controle.abort();
  }, [tentativa]);

  useEffect(() => {
    if (!user) return;
    const controle = new AbortController();
    api.get('/troca/mid', { signal: controle.signal }).then(({ data }) => setMinhas({ token, trocas: data }))
      .catch(() => { if (!controle.signal.aborted) setMinhas({ token, trocas: [] }); });
    return () => controle.abort();
  }, [user, token, tentativa]);
  const trocasDoUsuario = user && minhas.token === token ? minhas.trocas : [];
  const sugestao = user && minhas.token !== token ? ''
    : trocasDoUsuario.find(t => !['rejeitado', 'concluido'].includes(t.status))?._id || ultimaTroca();

  useEffect(() => {
    if (tradeInId || temEscolhaManual || carregandoUsuario || !sugestao) return;
    setParams(anteriores => {
      const novos = new URLSearchParams(anteriores);
      novos.set('tradeInId', sugestao);
      return novos;
    }, { replace: true });
  }, [tradeInId, temEscolhaManual, carregandoUsuario, sugestao, setParams]);

  useEffect(() => {
    if (!tradeInId || carregandoUsuario) return;
    const controle = new AbortController();
    api.get(`/troca/${encodeURIComponent(tradeInId)}`, { signal: controle.signal,
      headers: { 'X-Troca-Token': tokenDaTroca(tradeInId) } }).then(({ data }) => {
      setSolicitacao({ id: tradeInId, troca: data, erro: '' });
      lembrarTroca(tradeInId);
    }).catch(error => {
      if (!controle.signal.aborted) setSolicitacao({ id: tradeInId, troca: null,
        erro: error.response?.data?.error || 'Não foi possível recuperar sua troca.' });
    });
    return () => controle.abort();
  }, [tradeInId, carregandoUsuario, user, tentativa]);

  const produtos = catalogo.produtos;
  const troca = solicitacao.id === tradeInId ? solicitacao.troca : null;
  const carregandoTroca = Boolean(tradeInId && (solicitacao.id !== tradeInId || carregandoUsuario));
  const erroTroca = solicitacao.id === tradeInId ? solicitacao.erro : '';
  const modeloMeu = produtos.find(p => p._id === params.get('meu'));
  const varianteMeu = modeloMeu?.variants.find(v => v._id === params.get('variante'));
  const produtoAtual = troca ? produtos.find(p => p.nome === troca.modeloAparelho) : modeloMeu;
  const atual = troca ? { nome: troca.modeloAparelho, cor: troca.cor, capacidade: troca.capacidade,
    descricaoEstado: troca.descricaoEstado, produto: produtoAtual,
    imagem: troca.fotos?.frontal || produtoAtual?.variants.find(v => v.cor === troca.cor && v.capacidade === troca.capacidade)?.imagens?.[0] || produtoAtual?.imagem }
    : varianteMeu ? { nome: modeloMeu.nome, cor: varianteMeu.cor, capacidade: varianteMeu.capacidade,
      descricaoEstado: params.get('estado') || '', produto: modeloMeu, imagem: varianteMeu.imagens?.[0] || modeloMeu.imagem } : null;

  const selecionados = [];
  for (const chave of params.getAll('item')) {
    const [produtoId, variantId] = chave.split(':');
    const produto = produtos.find(p => p._id === produtoId && p.disponivel !== false);
    const variante = produto?.variants.find(v => v._id === variantId && varianteDisponivel(v));
    if (!variante || selecionados.some(s => s.produto._id === produtoId) || selecionados.length === 2) continue;
    selecionados.push({ produto, variante });
  }
  const solicitado = Math.max(0, PASSOS_COMPARAR.indexOf(params.get('passo')));
  const passo = !atual ? 0 : solicitado === 2 && !selecionados.length ? 1 : solicitado;
  const pronto = !catalogo.carregando && !catalogo.erro && !carregandoTroca && !erroTroca;
  const credito = creditoDaTroca(troca);
  const indisponivel = troca && ['rejeitado', 'concluido'].includes(troca.status);
  const aparelhosLoja = selecionados.map(({ produto, variante }) => ({ produto, variante, nome: produto.nome,
    cor: variante.cor, capacidade: variante.capacidade, imagem: variante.imagens?.[0] || produto.imagem }));
  const diferencas = camposDiferentes([atual, ...aparelhosLoja].filter(Boolean));

  useEffect(() => { titulo.current?.focus({ preventScroll: true }); }, [passo]);

  // Corrige links incompletos mantendo os parâmetros que ainda são válidos.
  useEffect(() => {
    if (!pronto || params.get('passo') === PASSOS_COMPARAR[passo]) return;
    setParams(anteriores => {
      const novos = new URLSearchParams(anteriores);
      novos.set('passo', PASSOS_COMPARAR[passo]);
      return novos;
    }, { replace: true });
  }, [pronto, passo, params, setParams]);

  const atualizar = (campos, replace = true) => {
    setAviso('');
    setParams(anteriores => {
      const novos = new URLSearchParams(anteriores);
      for (const [campo, valor] of Object.entries(campos)) {
        novos.delete(campo);
        if (Array.isArray(valor)) valor.forEach(item => novos.append(campo, item));
        else if (valor !== null && valor !== '') novos.set(campo, valor);
      }
      return novos;
    }, { replace });
  };
  const ir = indice => atualizar({ passo: PASSOS_COMPARAR[indice] }, false);
  const escolherMeu = produto => atualizar({ meu: produto?._id || 'manual', variante: produto?.variants[0]?._id || '', tradeInId: null, estado: null });
  const escolherVariante = (produto, variante) => atualizar({ item: selecionados.map(s =>
    `${s.produto._id}:${s.produto._id === produto._id ? variante._id : s.variante._id}`) });
  const selecionar = produto => {
    if (selecionados.length >= 2) return;
    const variante = produto.variants.find(varianteDisponivel);
    if (variante) atualizar({ item: [...selecionados.map(s => `${s.produto._id}:${s.variante._id}`), `${produto._id}:${variante._id}`] });
  };
  const comprar = ({ produto, variante }) => {
    if (finalizando.current || !atual || indisponivel) return;
    if (!troca) {
      const retorno = new URLSearchParams({ comparacao: params.toString(), modelo: atual.nome, capacidade: atual.capacidade,
        cor: atual.cor, estado: atual.descricaoEstado });
      navigate(`/troca?${retorno}`);
      return;
    }
    const item = itemDaVariante(produto, variante);
    const quantidade = itens.find(i => i._id === item._id)?.quantidade || 0;
    if (!varianteDisponivel(variante) || (variante.estoque != null && quantidade >= variante.estoque)) {
      setAviso('A quantidade desta variante já atingiu o estoque disponível no carrinho.'); return;
    }
    finalizando.current = true;
    adicionar(item);
    associarTroca(troca);
    navigate('/carrinho');
  };

  return <div className="comparar-page">
    <header className="comparar-header"><div className="comparar-wrap">
      <Link to="/" className="comparar-brand"><span className="comparar-mark" aria-hidden="true" /><span><em>place</em>tech</span></Link>
      <nav aria-label="Navegação principal"><Link to="/#catalogo">Catálogo</Link><Link to="/troca">Trocar meu aparelho</Link></nav>
    </div></header>
    <main className="comparar-wrap comparar-main">
      <Link to="/#catalogo" className="comparar-back"><ArrowLeftIcon /> Voltar ao catálogo</Link>
      <div className="comparar-intro"><span className="comparar-eyebrow"><ArrowsRightLeftIcon /> COMPARE. ESCOLHA. EVOLUA.</span>
        <h1>Seu upgrade começa <span>na escolha.</span></h1><p>Seu aparelho e seus favoritos da loja. Tudo na mesma tela.</p></div>
      <nav className="comparar-progresso" aria-label="Etapas da comparação"><div className="comparar-progress-meta"><span>Passo {passo + 1} de 3</span><strong>{Math.round((passo + 1) / 3 * 100)}%</strong></div>
        <div className="comparar-track" role="progressbar" aria-label="Progresso da comparação" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round((passo + 1) / 3 * 100)}><span style={{ width: `${(passo + 1) / 3 * 100}%` }} /></div>
        <ol>{['Seu aparelho', 'Aparelhos da loja', 'Comparativo'].map((label, i) => <li key={label} aria-current={passo === i ? 'step' : undefined}>
          <button disabled={!pronto || i > passo} onClick={() => ir(i)}><span>{i < passo ? <CheckIcon /> : `0${i + 1}`}</span>{label}</button>
        </li>)}</ol>
      </nav>
      <div className="comparar-heading"><span className="comparar-eyebrow">PASSO 0{passo + 1}</span>
        <h2 ref={titulo} tabIndex={-1}>{TITULOS[passo]}</h2><p>{TEXTOS[passo]}</p></div>
      {catalogo.carregando || carregandoTroca ? <p className="comparar-notice" role="status">Carregando {carregandoTroca ? 'sua troca' : 'catálogo'}…</p>
        : catalogo.erro || erroTroca ? <div className="comparar-notice comparar-error" role="alert"><p>{catalogo.erro || erroTroca}</p>
          <button className="comparar-button comparar-secondary" onClick={() => { setCatalogo(c => ({ ...c, carregando: true })); setTentativa(t => t + 1); }}>Tentar novamente</button>
          {erroTroca && <button className="comparar-button comparar-secondary" onClick={() => atualizar({ tradeInId: null, meu: 'manual', passo: 'aparelho' })}>Selecionar meu aparelho agora</button>}
        </div> : <>
          {passo === 0 && <section className="comparar-panel" aria-label="Seu aparelho para comparação">
            {trocasDoUsuario.length > 0 && <label className="comparar-field">Troca cadastrada<select value={tradeInId}
              onChange={e => atualizar({ tradeInId: e.target.value, meu: e.target.value ? null : 'manual' })}>
              <option value="">Selecionar aparelho na hora</option>{trocasDoUsuario.map(t => <option key={t._id} value={t._id}>{t.modeloAparelho} · {t.cor} · {t.capacidade} · {t.status}</option>)}
            </select></label>}
            {troca ? <div className="comparar-meu-resumo"><div className="comparar-meu-foto"><ImagemProduto src={atual.imagem} alt={atual.nome} /></div>
              <div><span className="comparar-eyebrow">TROCA CADASTRADA · {troca.status}</span><h3>{atual.nome}</h3><p>{atual.capacidade} · {atual.cor}</p>
                <p>{atual.descricaoEstado || 'Estado não descrito.'}</p><p>Valor da troca: <strong>{credito !== null ? moeda(credito) : 'Em avaliação'}</strong></p>
                <button className="comparar-button comparar-secondary" onClick={() => atualizar({ tradeInId: null, meu: 'manual' })}>Selecionar outro aparelho</button></div>
            </div> : <>
              <label className="comparar-field">Buscar seu modelo<input type="search" placeholder="Ex.: iPhone 14" value={buscaMeu} onChange={e => setBuscaMeu(e.target.value)} /></label>
              <label className="comparar-field">Modelo do seu aparelho<select value={modeloMeu?._id || ''} onChange={e => escolherMeu(produtos.find(p => p._id === e.target.value))}>
                <option value="">Selecione o modelo</option>{produtos.filter(p => p._id === modeloMeu?._id || p.nome.toLocaleLowerCase().includes(buscaMeu.toLocaleLowerCase())).map(p => <option key={p._id} value={p._id}>{p.nome}</option>)}
              </select></label>
              {modeloMeu && <SeletorVariantes produto={modeloMeu} variante={varianteMeu} permitirIndisponiveis onChange={v => atualizar({ variante: v._id })} />}
              <label className="comparar-field">Estado descrito<textarea rows={4} maxLength={4000} placeholder="Arranhões, bateria, acessórios…" value={params.get('estado') || ''} onChange={e => atualizar({ estado: e.target.value })} /></label>
              <p className="comparar-muted">Você pode comparar agora e concluir o cadastro da troca ao escolher seu próximo aparelho.</p>
              <Link className="comparar-text-link" to="/troca">Cadastrar minha troca para avaliação <ArrowRightIcon /></Link>
            </>}
            {indisponivel && <p className="comparar-notice">Esta troca está {troca.status}. Selecione outro aparelho para iniciar uma nova troca.</p>}
          </section>}
          {passo === 1 && <section aria-label="Aparelhos da loja">
            <div className="comparar-selecao-meta"><label className="comparar-field">Buscar no catálogo<input type="search" placeholder="Busque por modelo ou marca" value={busca} onChange={e => setBusca(e.target.value)} /></label>
              <span role="status">{selecionados.length} de 2 selecionados</span></div>
            {selecionados.length > 0 && <div className="comparar-selecionados">{selecionados.map(({ produto, variante }) => <section className="comparar-panel" key={produto._id} aria-label={`Variante escolhida de ${produto.nome}`}>
              <div className="comparar-selecionado-heading"><h3>{produto.nome}</h3><button className="comparar-icon-button" aria-label={`Remover ${produto.nome}`} onClick={() => atualizar({ item: selecionados.filter(s => s.produto._id !== produto._id).map(s => `${s.produto._id}:${s.variante._id}`) })}><XMarkIcon /></button></div>
              <SeletorVariantes produto={produto} variante={variante} onChange={v => escolherVariante(produto, v)} />
              <strong className="comparar-preco">{moeda(variante.preco)}</strong><span className="comparar-muted"> à vista</span>
            </section>)}</div>}
            <div className="comparar-catalogo">{produtos.filter(p => p.disponivel !== false && `${p.nome} ${p.marca}`.toLocaleLowerCase().includes(busca.toLocaleLowerCase())).map(produto => {
              const escolhido = selecionados.some(s => s.produto._id === produto._id);
              const variante = produto.variants.find(varianteDisponivel);
              return <article className={`comparar-mini-card ${escolhido ? 'is-selected' : ''}`} key={produto._id}>
                <ImagemProduto src={variante?.imagens?.[0] || produto.imagem} alt={produto.nome} /><span className="comparar-muted">{produto.marca} · {produto.categoria}</span>
                <h3>{produto.nome}</h3><p>{variante ? <>A partir de <strong>{moeda(produto.precoAPartir ?? variante.preco)}</strong></> : 'Indisponível'}</p>
                <button className="comparar-button comparar-secondary" disabled={escolhido || selecionados.length === 2 || !variante} onClick={() => selecionar(produto)}
                  aria-label={`Selecionar ${produto.nome}`}>{escolhido ? <><CheckIcon /> Selecionado</> : <><PlusIcon /> Selecionar</>}</button>
              </article>;
            })}</div>
            {!produtos.some(p => p.disponivel !== false && `${p.nome} ${p.marca}`.toLocaleLowerCase().includes(busca.toLocaleLowerCase())) && <p className="comparar-notice">Nenhum aparelho encontrado. Tente outro modelo ou marca.</p>}
          </section>}
          {passo === 2 && <section aria-label="Comparativo lado a lado">
            <div className="comparar-legenda"><span /> Diferenças destacadas em laranja <small>As diferenças não indicam, por si só, melhor desempenho.</small></div>
            <div className="comparar-cartoes" style={{ '--colunas': aparelhosLoja.length + 1 }}>
              <CartaoComparacao aparelho={atual} diferencas={diferencas} credito={credito} troca={troca} />
              {aparelhosLoja.map(aparelho => <CartaoComparacao key={aparelho.produto._id} aparelho={aparelho} atual={atual}
                diferencas={diferencas} credito={credito} troca={troca} bloqueado={indisponivel} onComprar={() => comprar(aparelho)} />)}
            </div>
          </section>}
        </>}
      {aviso && <p className="comparar-notice" role="alert">{aviso}</p>}
      <div className="comparar-actions"><button className="comparar-button comparar-secondary" disabled={passo === 0} onClick={() => ir(passo - 1)}><ArrowLeftIcon /> Voltar</button>
        {passo < 2 && <button className="comparar-button comparar-primary" disabled={!pronto || !atual || passo === 1 && !selecionados.length} onClick={() => ir(passo + 1)}>Avançar <ArrowRightIcon /></button>}
        {passo === 2 && <span className="comparar-muted">Escolha o aparelho que combina com você.</span>}
      </div>
    </main>
    <footer className="comparar-footer comparar-wrap">Placetech · Tecnologia para o seu próximo passo.</footer>
  </div>;
}
