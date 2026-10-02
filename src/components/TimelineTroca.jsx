import { historicoDaTroca, STATUS_TROCA, dataDaTroca } from '../utils/statusTroca';
import { moeda } from '../utils/variantes';

export default function TimelineTroca({ troca }) {
  const eventos = historicoDaTroca(troca);
  return <ol className="troca-timeline" aria-label="Linha do tempo da troca">{eventos.map((evento, i) => <li key={`${evento.data}-${i}`} aria-current={i === eventos.length - 1 ? 'step' : undefined}>
    <span className={`trocas-status trocas-status-${evento.status}`}>{STATUS_TROCA[evento.status] || evento.status}</span>
    <time dateTime={evento.data || undefined}>{dataDaTroca(evento.data, true)}</time>
    {evento.status === 'aprovado' && evento.valorOferta != null && <p>Oferta: <strong>{moeda(evento.valorOferta)}</strong></p>}
    {evento.status === 'rejeitado' && evento.motivoRejeicao && <p>{evento.motivoRejeicao}</p>}
  </li>)}</ol>;
}
