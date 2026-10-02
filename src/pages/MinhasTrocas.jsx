import SiteHeader from '../components/SiteHeader';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import api from '../services/api';
import TimelineTroca from '../components/TimelineTroca';
import { lembrarTroca, tokenDaTroca, ultimaTroca } from '../utils/comparar';
import { moeda } from '../utils/variantes';
import { STATUS_TROCA, dataDaTroca } from '../utils/statusTroca';
import './TrocasAdmin.css';

export default function MinhasTrocas() {
  const { user, token, carregandoUsuario, erroUsuario, recarregarUsuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const protocolo = params.get('protocolo') || (!user ? ultimaTroca() : '');
  const [entrada, setEntrada] = useState(protocolo);
  const [tentativa, setTentativa] = useState(0);
  const [resultado, setResultado] = useState({ chave: '', trocas: [], erro: '' });
  const chave = `${token || 'visitante'}:${protocolo || 'minhas'}`;

  useEffect(() => {
    if (carregandoUsuario || erroUsuario || !user && !protocolo) return;
    const controle = new AbortController();
    const requisicao = protocolo ? api.get(`/troca/${encodeURIComponent(protocolo)}`, { signal: controle.signal, headers: { 'X-Troca-Token': tokenDaTroca(protocolo) } })
      : api.get('/troca/mid', { signal: controle.signal });
    requisicao.then(({ data }) => {
      setResultado({ chave, trocas: protocolo ? [data] : data, erro: '' });
      if (protocolo) lembrarTroca(data._id);
    }).catch(error => { if (!controle.signal.aborted) setResultado({ chave, trocas: [],
      erro: error.response?.data?.error || 'Não foi possível consultar suas trocas. Tente novamente.' }); });
    return () => controle.abort();
  }, [user, protocolo, token, chave, carregandoUsuario, erroUsuario, tentativa]);

  useEffect(() => {
    const atualizar = () => { if (!document.hidden) setTentativa(t => t + 1); };
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);
    const intervalo = setInterval(atualizar, 30000);
    return () => { window.removeEventListener('focus', atualizar); document.removeEventListener('visibilitychange', atualizar); clearInterval(intervalo); };
  }, []);

  const trocas = resultado.chave === chave ? resultado.trocas : [];
  const atual = trocas.find(t => t._id === protocolo) || trocas[0];
  const carregando = carregandoUsuario || (user || protocolo) && resultado.chave !== chave;
  const erro = erroUsuario || (resultado.chave === chave ? resultado.erro : '');
  const consultar = event => {
    event.preventDefault();
    if (!/^[a-f\d]{24}$/i.test(entrada.trim())) return;
    setParams({ protocolo: entrada.trim() }); setTentativa(t => t + 1);
  };
  return <div className="troca-acomp-page"><SiteHeader />
    <main className="troca-acomp-main"><span className="trocas-eyebrow">ACOMPANHE SEU PRÓXIMO PASSO</span><h1>Minhas trocas</h1><p className="trocas-muted">As decisões da equipe aparecem aqui, com o histórico da sua solicitação.</p>
      {!user && !carregandoUsuario && <form className="trocas-consulta trocas-box" onSubmit={consultar}>
        <label>Protocolo da troca<input required pattern="[a-fA-F0-9]{24}" maxLength={24} value={entrada} onChange={e => setEntrada(e.target.value)} placeholder="Código recebido ao enviar sua troca" /></label>
        <button type="submit" className="trocas-btn">Consultar troca</button><p className="trocas-muted">Use o navegador em que você cadastrou a troca para recuperar o acesso ao protocolo.</p>
      </form>}
      {trocas.length > 1 && <label className="trocas-escolha">Selecione uma solicitação<select value={atual?._id || ''} onChange={e => setParams({ protocolo: e.target.value })}>{trocas.map(t => <option key={t._id} value={t._id}>{t.modeloAparelho} · {STATUS_TROCA[t.status]} · {dataDaTroca(t.createdAt)}</option>)}</select></label>}
      {user && params.has('protocolo') && <Link className="trocas-back" to="/troca/mid">Ver todas as minhas solicitações</Link>}
      {carregando && <p className="trocas-box" role="status">Carregando suas trocas…</p>}
      {erro && <div className="trocas-erro" role="alert"><p>{erro}</p><button className="trocas-btn" onClick={() => erroUsuario ? recarregarUsuario() : setTentativa(t => t + 1)}>Tentar novamente</button></div>}
      {!carregando && !erro && user && !trocas.length && <div className="trocas-box"><p>Você ainda não tem solicitações de troca.</p><Link className="trocas-btn" to="/troca">Cadastrar minha troca</Link></div>}
      {atual && <article className="trocas-box"><div className="trocas-titulo"><div><span className="trocas-eyebrow">PROTOCOLO {atual._id}</span><h2>{atual.modeloAparelho}</h2><p>{atual.capacidade} · {atual.cor}</p></div><span className={`trocas-status trocas-status-${atual.status}`}>{STATUS_TROCA[atual.status]}</span></div>
        {atual.status === 'aprovado' && atual.valorOferta != null && <div className="troca-acomp-oferta"><span>Sua oferta de troca</span><strong>{moeda(atual.valorOferta)}</strong><Link to={`/comparar?tradeInId=${atual._id}`} className="trocas-btn">Comparar com esta troca →</Link></div>}
        <p className="trocas-descricao">{atual.descricaoEstado || 'Estado não descrito.'}</p><h3>Linha do tempo</h3><TimelineTroca troca={atual} />
        <div className="troca-acomp-acoes"><button className="trocas-btn trocas-btn-secondary" onClick={() => setTentativa(t => t + 1)}>Atualizar status</button><Link to={`/comparar?tradeInId=${atual._id}`} className="trocas-back">Comparar aparelhos</Link></div>
      </article>}
    </main>
  </div>;
}
