import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LayoutAdmin from '../components/LayoutAdmin';
import GaleriaTroca from '../components/GaleriaTroca';
import TimelineTroca from '../components/TimelineTroca';
import { useTrocasAdmin } from '../context/trocasAdmin';
import api from '../services/api';
import { moeda } from '../utils/variantes';
import { STATUS_TROCA, dataDaTroca } from '../utils/statusTroca';
import './TrocasAdmin.css';

export default function TrocaAdminDetalhe() {
  const { id } = useParams();
  const { registrar } = useTrocasAdmin();
  const [resultado, setResultado] = useState({ id: '', troca: null, erro: '' });
  const [tentativa, setTentativa] = useState(0);
  const [oferta, setOferta] = useState('');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    const controle = new AbortController();
    api.get(`/troca/admin/${encodeURIComponent(id)}`, { signal: controle.signal }).then(({ data }) => {
      setResultado({ id, troca: data, erro: '' }); setOferta(data.valorOferta == null ? '' : String(data.valorOferta)); setMotivo(data.motivoRejeicao || '');
    }).catch(error => { if (!controle.signal.aborted) setResultado({ id, troca: null,
      erro: error.response?.data?.error || 'Não foi possível carregar a solicitação.' }); });
    return () => controle.abort();
  }, [id, tentativa]);
  const troca = resultado.id === id ? resultado.troca : null;
  const atualizar = async (status, event) => {
    event?.preventDefault();
    if (salvando) return;
    const valor = Number(oferta);
    if (status === 'aprovado' && (!oferta.trim() || !Number.isFinite(valor) || valor < 0)) { setErro('Informe um valor de oferta válido.'); return; }
    if (status === 'rejeitado' && !motivo.trim()) { setErro('Informe o motivo da rejeição.'); return; }
    setSalvando(true); setErro(''); setAviso('');
    try {
      const campos = { status, ...(status === 'aprovado' ? { valorOferta: valor } : {}), ...(status === 'rejeitado' ? { motivoRejeicao: motivo.trim() } : {}) };
      const { data } = await api.patch(`/troca/${id}/status`, campos);
      setResultado({ id, troca: data.solicitacao, erro: '' }); registrar(data.solicitacao);
      setAviso(`Status atualizado: ${STATUS_TROCA[status]}. O cliente já pode consultar a decisão.`);
    } catch (error) { setErro(error.response?.data?.error || 'Não foi possível atualizar a troca. Tente novamente.'); }
    finally { setSalvando(false); }
  };
  return <LayoutAdmin titulo="Detalhe da troca" subtitulo="Confira o aparelho antes de definir sua oferta">
    <section className="trocas-admin"><Link className="trocas-back" to="/loja/trocas">← Voltar às trocas</Link>
      {!troca ? <div className="trocas-box">{resultado.id === id && resultado.erro ? <><p role="alert" className="trocas-erro">{resultado.erro}</p>
        <button className="trocas-btn" onClick={() => setTentativa(t => t + 1)}>Tentar novamente</button></> : <p role="status">Carregando solicitação…</p>}</div> : <>
        <div className="trocas-titulo"><div><span className="trocas-eyebrow">PROTOCOLO {troca._id}</span><h1>{troca.modeloAparelho}</h1><p>{troca.capacidade} · {troca.cor} · {dataDaTroca(troca.createdAt, true)}</p></div>
          <span className={`trocas-status trocas-status-${troca.status}`}>{STATUS_TROCA[troca.status]}</span></div>
        <section className="trocas-box"><h2>Fotos do aparelho</h2><p className="trocas-muted">Clique em uma foto para ampliar. Use Esc para fechar.</p><GaleriaTroca fotos={troca.fotos} /></section>
        <div className="trocas-detalhe-grid"><section className="trocas-box"><h2>Estado e dados do aparelho</h2>
          <p className="trocas-descricao">{troca.descricaoEstado || 'Nenhuma descrição adicional informada.'}</p><dl className="trocas-dados"><div><dt>IMEI</dt><dd>{troca.imei}</dd></div><div><dt>Oferta atual</dt><dd>{troca.valorOferta == null ? 'Sem oferta' : moeda(troca.valorOferta)}</dd></div></dl>
          <h2>Dados do cliente</h2><dl className="trocas-dados">{[['nome', 'Nome'], ['email', 'Email'], ['telefone', 'Telefone']].map(([campo, label]) => <div key={campo}><dt>{label}</dt><dd>{troca[campo] || 'Não informado'}</dd></div>)}</dl>
        </section><section className="trocas-box"><h2>Avaliação da troca</h2>
          {troca.status === 'concluido' ? <p>Esta troca já foi concluída.</p> : <fieldset className="trocas-acoes" disabled={salvando}>
            <button type="button" className="trocas-btn trocas-btn-secondary" disabled={troca.status === 'em_avaliacao'} onClick={() => atualizar('em_avaliacao')}>Mover para Em avaliação</button>
            <form onSubmit={e => atualizar('aprovado', e)}><label>Valor da oferta (R$)<input type="number" min="0" step="0.01" required value={oferta} onChange={e => setOferta(e.target.value)} placeholder="0,00" /></label>
              <button className="trocas-btn trocas-btn-aprovar" type="submit">Aprovar troca</button></form>
            <form onSubmit={e => atualizar('rejeitado', e)}><label>Motivo da rejeição<textarea required maxLength={2000} rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Explique por que a troca não foi aprovada" /></label>
              <button className="trocas-btn trocas-btn-rejeitar" type="submit">Rejeitar troca</button></form>
          </fieldset>}
          {erro && <p className="trocas-erro" role="alert">{erro}</p>}{aviso && <p className="trocas-sucesso" role="status">{aviso}</p>}{salvando && <p className="trocas-muted">Salvando decisão…</p>}
        </section></div>
        <section className="trocas-box"><h2>Histórico da solicitação</h2><TimelineTroca troca={troca} /></section>
      </>}
    </section>
  </LayoutAdmin>;
}
