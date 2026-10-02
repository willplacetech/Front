import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import './TrocasAdmin.css';

const LIMITE_ITENS = 30;
const LIMITE_CARACTERES = 200;

export default function ConfiguracoesTroca() {
  const [resultado, setResultado] = useState({ checklist: [], carregando: true, erro: '' });
  const [itens, setItens] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    const controle = new AbortController();
    api.get('/troca/configuracoes', { signal: controle.signal })
      .then(({ data }) => {
        const checklist = Array.isArray(data.checklist) ? data.checklist : [];
        setItens(checklist);
        setResultado({ checklist, carregando: false, erro: '' });
      })
      .catch(error => {
        if (!controle.signal.aborted) setResultado({ checklist: [], carregando: false,
          erro: error.response?.data?.error || 'Não foi possível carregar as configurações da troca.' });
      });
    return () => controle.abort();
  }, []);

  const alterar = (indice, valor) => {
    setItens(atuais => atuais.map((item, i) => i === indice ? valor : item));
    setAviso('');
  };

  const salvar = async event => {
    event.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErroSalvar('');
    setAviso('');
    try {
      const checklist = itens.map(item => item.trim());
      const { data } = await api.put('/troca/configuracoes', { checklist });
      setItens(data.checklist);
      setResultado(atual => ({ ...atual, checklist: data.checklist }));
      setAviso('Checklist da troca salvo. Ele já está disponível no cadastro do cliente.');
    } catch (error) {
      setErroSalvar(error.response?.data?.error || 'Não foi possível salvar o checklist. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return <LayoutAdmin titulo="Configurações" subtitulo="Configure as orientações exibidas no cadastro de troca">
    <section className="trocas-admin">
      <div className="trocas-titulo"><div><span className="trocas-eyebrow">EXPERIÊNCIA DE TROCA</span>
        <h1>Checklist do cliente</h1>
        <p>Os itens cadastrados aparecem para o cliente na etapa de confirmação da troca.</p>
      </div></div>
      {resultado.carregando ? <p className="trocas-box" role="status">Carregando configurações…</p> : <>
        {resultado.erro && <div className="trocas-erro" role="alert"><p>{resultado.erro}</p></div>}
        {!resultado.erro && <form className="trocas-box" onSubmit={salvar}>
          <p className="trocas-muted">Cadastre até {LIMITE_ITENS} orientações curtas. Cada item pode ter até {LIMITE_CARACTERES} caracteres.</p>
          <div className="config-troca-itens">
            {itens.map((item, indice) => <label className="config-troca-item" key={indice}>
              <span>Item {indice + 1}</span>
              <input type="text" required maxLength={LIMITE_CARACTERES} value={item}
                onChange={event => alterar(indice, event.target.value)}
                placeholder="Ex.: Remova a capinha antes de fotografar o aparelho" />
              <button type="button" className="trocas-btn trocas-btn-secondary"
                aria-label={`Remover item ${indice + 1}`} onClick={() => {
                  setItens(atuais => atuais.filter((_, i) => i !== indice));
                  setAviso('');
                }}><TrashIcon /></button>
            </label>)}
          </div>
          <div className="config-troca-acoes">
            <button type="button" className="trocas-btn trocas-btn-secondary"
              disabled={itens.length >= LIMITE_ITENS || salvando} onClick={() => {
                setItens(atuais => [...atuais, '']);
                setAviso('');
              }}><PlusIcon /> Adicionar item</button>
            <button type="submit" className="trocas-btn" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar checklist'}
            </button>
          </div>
          {erroSalvar && <p className="trocas-erro" role="alert">{erroSalvar}</p>}
          {aviso && <p className="trocas-sucesso" role="status">{aviso}</p>}
          {!itens.length && <p className="trocas-muted">Nenhum item cadastrado. O checklist não será exibido aos clientes até você adicionar orientações.</p>}
        </form>}
      </>}
    </section>
  </LayoutAdmin>;
}
