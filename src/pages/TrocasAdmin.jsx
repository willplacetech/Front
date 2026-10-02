import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LayoutAdmin from '../components/LayoutAdmin';
import { useTrocasAdmin } from '../context/trocasAdmin';
import api from '../services/api';
import { moeda } from '../utils/variantes';
import { STATUS_TROCA, dataDaTroca } from '../utils/statusTroca';
import './TrocasAdmin.css';

export default function TrocasAdmin() {
  const { trocas, pendentes, carregando, erro, recarregar } = useTrocasAdmin();
  const [params, setParams] = useSearchParams();
  const filtro = params.get('status') === 'todos' ? '' : STATUS_TROCA[params.get('status')] ? params.get('status') : 'pendente';
  const [exportando, setExportando] = useState(false);
  const [erroExportar, setErroExportar] = useState('');
  const filtradas = trocas.filter(t => !filtro || t.status === filtro).sort((a, b) =>
    Number(b.status === 'pendente') - Number(a.status === 'pendente') || new Date(b.createdAt) - new Date(a.createdAt));
  const exportar = async () => {
    if (exportando) return;
    setExportando(true); setErroExportar('');
    try {
      const { data } = await api.get('/troca/admin/exportar', { params: filtro ? { status: filtro } : {}, responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url; link.download = 'trocas.csv'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setErroExportar('Não foi possível exportar as trocas. Tente novamente.'); }
    finally { setExportando(false); }
  };
  return <LayoutAdmin titulo="Trocas" subtitulo="Avaliação de aparelhos e ofertas de troca">
    <section className="trocas-admin">
      <div className="trocas-titulo"><div><span className="trocas-eyebrow">UM NOVO CICLO PARA CADA APARELHO</span><h1>Solicitações de troca</h1>
        <p><strong>{pendentes} pendente{pendentes === 1 ? '' : 's'}</strong> aguardando sua avaliação.</p></div>
        <button className="trocas-btn" disabled={exportando || carregando || Boolean(erro)} onClick={exportar}><ArrowDownTrayIcon />{exportando ? 'Exportando…' : 'Exportar CSV'}</button>
      </div>
      <div className="trocas-filtros"><label>Filtrar por status<select value={filtro} onChange={e => setParams({ status: e.target.value || 'todos' })}>
        <option value="">Todos os status</option>{Object.entries(STATUS_TROCA).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
      </select></label><button className="trocas-btn trocas-btn-secondary" disabled={carregando} onClick={recarregar}><ArrowPathIcon /> Atualizar</button></div>
      {erroExportar && <p className="trocas-erro" role="alert">{erroExportar}</p>}
      {erro && <p className="trocas-erro" role="alert">{erro}</p>}
      {carregando ? <p className="trocas-vazio" role="status">Carregando solicitações…</p> : !erro && <div className="trocas-tabela-wrap"><table className="trocas-tabela">
        <thead><tr>{['Protocolo', 'Data', 'Nome', 'Modelo', 'IMEI', 'Status', 'Valor oferta'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{filtradas.map(t => <tr key={t._id} className={t.status === 'pendente' ? 'trocas-pendente' : ''}>
          <td><Link aria-label={`Abrir troca ${t._id}`} to={`/loja/trocas/${t._id}`} className="trocas-protocolo">{t._id}</Link></td>
          <td>{dataDaTroca(t.createdAt)}</td><td>{t.nome || 'Cliente cadastrado'}</td>
          <td>{t.modeloAparelho}<small>{t.cor} · {t.capacidade}</small></td><td className="trocas-imei">{t.imei}</td>
          <td><span className={`trocas-status trocas-status-${t.status}`}>{STATUS_TROCA[t.status] || t.status}</span></td>
          <td>{t.valorOferta != null ? moeda(t.valorOferta) : '—'}</td>
        </tr>)}</tbody>
      </table>{!filtradas.length && <p className="trocas-vazio">Nenhuma solicitação neste status.</p>}</div>}
    </section>
  </LayoutAdmin>;
}
