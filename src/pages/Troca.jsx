import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ArrowLeftIcon, ArrowPathRoundedSquareIcon, ArrowRightIcon, CameraIcon, CheckIcon, CheckCircleIcon,
  ClipboardDocumentCheckIcon, ClockIcon, DevicePhoneMobileIcon, PhoneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuth } from '../context/auth';
import FotoSlot, { FotoPreview } from '../components/FotosTroca';
import { CAMPOS_CONTATO, CAMPOS_PASSOS, FOTOS_TROCA, dadosParaEnvio, modelosDoCatalogo,
  opcoesDoModelo, validarFoto, validarImei } from '../utils/troca';
import './Troca.css';
import { lembrarTroca, retornoDaComparacao } from '../utils/comparar';

const PASSOS = [
  { titulo: 'Aparelho', chamada: 'Qual aparelho você quer trocar?', texto: 'Encontre seu modelo e conte um pouco sobre ele.', icon: DevicePhoneMobileIcon },
  { titulo: 'Fotos', chamada: 'Vamos olhar de todos os ângulos.', texto: 'Adicione as cinco fotos para uma avaliação mais precisa.', icon: CameraIcon },
  { titulo: 'Descrição e IMEI', chamada: 'Os detalhes fazem a diferença.', texto: 'Conte sobre o estado do aparelho e informe seu IMEI.', icon: ClipboardDocumentCheckIcon },
  { titulo: 'Confirmação', chamada: 'Tudo pronto para a avaliação.', texto: 'Confira seu aparelho, as fotos e os dados para contato.', icon: CheckCircleIcon }
];
const INICIAL = { modeloAparelho: '', capacidade: '', cor: '', descricaoEstado: '', imei: '', nome: '', email: '', telefone: '',
  fotos: Object.fromEntries(FOTOS_TROCA.map(({ campo }) => [campo, null])) };

function ErroCampo({ nome, errors }) {
  return errors[nome] ? <p id={`${nome}-error`} className="troca-error" role="alert">{errors[nome].message}</p> : null;
}

export default function Troca() {
  const [params] = useSearchParams();
  const comparacao = params.get('comparacao') || '';
  const { user, token, carregandoUsuario, erroUsuario, recarregarUsuario, sair } = useAuth();
  const [passo, setPasso] = useState(0);
  const [catalogo, setCatalogo] = useState({ modelos: [], carregando: true, erro: '' });
  const [tentativa, setTentativa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erroEnvio, setErroEnvio] = useState('');
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [sucesso, setSucesso] = useState(null);
  const titulo = useRef(null);
  const processamento = useRef(false);
  const { register, control, trigger, getValues, getFieldState, setValue, setError, clearErrors,
    formState: { errors } } = useForm({ defaultValues: { ...INICIAL,
      ...(comparacao ? { modeloAparelho: params.get('modelo') || '', capacidade: params.get('capacidade') || '',
        cor: params.get('cor') || '', descricaoEstado: params.get('estado') || '' } : {}) }, mode: 'onTouched', shouldUnregister: false });
  const dados = useWatch({ control });
  const modelo = catalogo.modelos.find(item => item.nome === dados.modeloAparelho);
  const { capacidades, cores } = opcoesDoModelo(modelo, dados.capacidade);
  const fotos = dados.fotos || {};
  const totalFotos = FOTOS_TROCA.filter(({ campo }) => fotos[campo]).length;

  useEffect(() => {
    const controle = new AbortController();
    api.get('/produtos', { signal: controle.signal }).then(({ data }) => {
      const modelos = modelosDoCatalogo(data);
      setCatalogo({ modelos, carregando: false, erro: modelos.length ? '' : 'Nenhum modelo disponível no catálogo no momento.' });
    }).catch(error => {
      if (!controle.signal.aborted) setCatalogo({ modelos: [], carregando: false,
        erro: error.response?.data?.error || 'Não foi possível carregar os modelos do catálogo.' });
    });
    return () => controle.abort();
  }, [tentativa]);

  useEffect(() => {
    if (!user) return;
    for (const campo of CAMPOS_CONTATO) {
      if (!getFieldState(campo).isDirty) setValue(campo, user[campo] || '', { shouldValidate: false });
    }
  }, [user, getFieldState, setValue]);

  useEffect(() => {
    titulo.current?.focus({ preventScroll: true });
  }, [passo, sucesso]);

  const atributos = nome => ({ 'aria-invalid': Boolean(errors[nome]), 'aria-required': nome !== 'descricaoEstado',
    'aria-describedby': errors[nome] ? `${nome}-error` : undefined });

  const reenviarCatalogo = () => {
    setCatalogo({ modelos: [], carregando: true, erro: '' });
    setTentativa(valor => valor + 1);
  };

  const mudarPasso = valor => {
    setPasso(valor);
    setErroEnvio('');
  };

  const enviar = async event => {
    event.preventDefault();
    if (processamento.current || sucesso) return;
    processamento.current = true;
    try {
      const campos = passo === 3 ? CAMPOS_PASSOS.flat() : CAMPOS_PASSOS[passo];
      if (!await trigger(campos, { shouldFocus: true })) {
        if (passo === 3) {
          const invalido = CAMPOS_PASSOS.findIndex(lista => lista.some(campo => getFieldState(campo).invalid));
          if (invalido >= 0) setPasso(invalido);
        }
        return;
      }
      if (passo < 3) { setPasso(passo + 1); return; }
      if (carregandoUsuario || erroUsuario) return;
      setEnviando(true);
      setProgresso(0);
      setErroEnvio('');
      setSessaoExpirada(false);
      const { data } = await api.post('/troca', dadosParaEnvio(getValues()), {
        onUploadProgress: ({ loaded, total }) => { if (total) setProgresso(Math.min(100, Math.round(loaded / total * 100))); }
      });
      if (!data.sucesso || !data.id || data.status !== 'pendente') throw new Error('Resposta inesperada. Não foi possível confirmar sua solicitação.');
      // Guarda a chave devolvida pela API para o acompanhamento autorizado do visitante.
      if (data.acessoToken) {
        try { sessionStorage.setItem(`troca:${data.id}`, data.acessoToken); } catch { /* O sucesso independe de armazenamento local. */ }
      }
      lembrarTroca(data.id);
      setSucesso({ id: data.id, protocolo: data.protocolo || data.id });
    } catch (error) {
      const mensagem = error.response?.data?.error || error.message || 'Não foi possível enviar sua solicitação. Tente novamente.';
      if (error.response?.status === 409) {
        setError('imei', { type: 'server', message: mensagem });
        setPasso(2);
      } else {
        setErroEnvio(error.response ? mensagem : 'Não foi possível confirmar o envio. Verifique sua conexão e tente novamente.');
        setSessaoExpirada(error.response?.status === 401);
      }
    } finally {
      processamento.current = false;
      setEnviando(false);
    }
  };

  return <div className="troca-page">
    <header className="troca-header"><div className="troca-wrap troca-header-inner">
      <Link to="/" className="troca-brand" aria-label="Placetech, início"><span className="troca-mark" aria-hidden="true" /><span><em>place</em>tech</span></Link>
      <nav aria-label="Navegação principal"><Link to="/#catalogo">Catálogo</Link><Link to="/troca" aria-current="page">Trocar meu aparelho</Link></nav>
    </div></header>
    <main className="troca-wrap troca-main">
      <Link to="/#catalogo" className="troca-back"><ArrowLeftIcon /> Voltar ao catálogo</Link>
      <div className="troca-intro"><span className="troca-eyebrow"><ArrowPathRoundedSquareIcon /> UM NOVO CICLO PARA SEU APARELHO</span>
        <h1>Trocar meu <span>aparelho.</span></h1><p>Seu próximo upgrade começa aqui. Envie seu aparelho para avaliação em poucos passos.</p>
      </div>
      {sucesso ? <div className="troca-success" role="status">
        <div className="troca-success-icon"><CheckCircleIcon /></div>
        <span className="troca-eyebrow">SOLICITAÇÃO RECEBIDA</span>
        <h2 tabIndex={-1} ref={titulo}>Agora é com a Placetech.</h2>
        <p className="troca-pending">Sua troca está <strong>PENDENTE</strong> — entraremos em contato em até 24h.</p>
        <div className="troca-protocol"><span>Número do protocolo</span><strong>{sucesso.protocolo}</strong><p>Guarde este número para consultar nossa equipe.</p></div>
        <p>Enviaremos o retorno pelos dados de contato informados.</p>
        <Link to={`/troca/mid?protocolo=${sucesso.id}`} className="troca-button troca-button-secondary">Acompanhar minha troca</Link>
        <Link to={retornoDaComparacao(comparacao, sucesso.id)} className="troca-button troca-button-primary">
          {comparacao ? 'Continuar minha comparação' : 'Comparar meu próximo aparelho'} <ArrowRightIcon />
        </Link>
        <Link to="/#catalogo" className="troca-button troca-button-primary">Explorar o catálogo <ArrowRightIcon /></Link>
      </div> : <>
        <div className="troca-progress" aria-label="Progresso da solicitação">
          <div className="troca-progress-meta"><span>Passo {passo + 1} de 4</span><strong>{Math.round((passo + 1) / 4 * 100)}%</strong></div>
          <div className="troca-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={(passo + 1) * 25} aria-valuetext={`Passo ${passo + 1} de 4: ${PASSOS[passo].titulo}`} aria-label="Etapas da troca">
            <span style={{ width: `${(passo + 1) * 25}%` }} />
          </div>
          <ol className="troca-steps">{PASSOS.map(({ titulo: label, icon: Icon }, indice) => <li key={label} className={indice === passo ? 'is-current' : indice < passo ? 'is-complete' : ''} aria-current={indice === passo ? 'step' : undefined}>
            <span className="troca-step-icon">{indice < passo ? <CheckIcon /> : <Icon />}</span><span>{label}</span>
          </li>)}</ol>
        </div>
        <div className="troca-layout">
          <form className="troca-form" onSubmit={enviar} noValidate>
            <div className="troca-form-heading"><span className="troca-eyebrow">PASSO 0{passo + 1}</span>
              <h2 ref={titulo} tabIndex={-1}>{PASSOS[passo].chamada}</h2><p>{PASSOS[passo].texto}</p>
            </div>
            <fieldset className="troca-form-body" disabled={enviando}>
              <section className="troca-panel" hidden={passo !== 0} aria-label="Aparelho">
                {catalogo.carregando && <p className="troca-notice" role="status">Carregando modelos do catálogo…</p>}
                {catalogo.erro && <div className="troca-notice troca-notice-error" role="alert"><p>{catalogo.erro}</p>
                  <button type="button" onClick={reenviarCatalogo}>Tentar novamente</button></div>}
                <label className="troca-field" htmlFor="modeloAparelho">Modelo do aparelho <span>*</span>
                  <input id="modeloAparelho" type="search" list="modelos-troca" placeholder="Busque seu modelo, ex.: iPhone 15"
                    autoComplete="off" disabled={catalogo.carregando || Boolean(catalogo.erro)} {...atributos('modeloAparelho')}
                    {...register('modeloAparelho', { required: 'Selecione o modelo do seu aparelho.',
                      validate: valor => catalogo.modelos.some(item => item.nome === valor) || 'Selecione um modelo da lista do catálogo.',
                      onChange: () => { setValue('capacidade', ''); setValue('cor', ''); clearErrors(['capacidade', 'cor']); } })} />
                </label>
                <datalist id="modelos-troca">{catalogo.modelos.map(item => <option key={item.nome} value={item.nome} />)}</datalist>
                <ErroCampo nome="modeloAparelho" errors={errors} />
                <p className="troca-help">Busque e selecione um dos modelos do nosso catálogo.</p>
                <div className="troca-fields-row">
                  <div><label className="troca-field" htmlFor="capacidade">Capacidade <span>*</span>
                    <Controller control={control} name="capacidade" rules={{ required: 'Selecione a capacidade.',
                      validate: valor => capacidades.includes(valor) || 'Selecione uma capacidade deste modelo.' }}
                      render={({ field }) => <select id="capacidade" disabled={!modelo} {...atributos('capacidade')} {...field}
                        onChange={event => { field.onChange(event); setValue('cor', ''); clearErrors('cor'); }}>
                      <option value="">Selecione a capacidade</option>{capacidades.map(valor => <option key={valor} value={valor}>{valor}</option>)}
                    </select>} /></label><ErroCampo nome="capacidade" errors={errors} /></div>
                  <div><label className="troca-field" htmlFor="cor">Cor <span>*</span>
                    <Controller control={control} name="cor" rules={{ required: 'Selecione a cor.',
                      validate: valor => cores.includes(valor) || 'Selecione uma cor para esta capacidade.' }}
                      render={({ field }) => <select id="cor" disabled={!modelo || !dados.capacidade} {...atributos('cor')} {...field}>
                      <option value="">Selecione a cor</option>{cores.map(valor => <option key={valor} value={valor}>{valor}</option>)}
                    </select>} /></label><ErroCampo nome="cor" errors={errors} /></div>
                </div>
                <div className="troca-inline-tip"><DevicePhoneMobileIcon /><p>Você encontra o modelo e a capacidade em <strong>Ajustes → Geral → Sobre</strong> no iPhone ou em <strong>Configurações → Sobre o telefone</strong> no Android.</p></div>
              </section>
              <section className="troca-panel" hidden={passo !== 1} aria-label="Fotos do aparelho">
                <div className="troca-photo-instructions"><p>Use boa iluminação e enquadre todo o aparelho. Os desenhos mostram o ângulo de cada foto.</p>
                  <span>JPEG, PNG ou WebP · até 5 MB por foto</span></div>
                <div className="troca-photo-counter" aria-live="polite"><CameraIcon /><strong>{totalFotos} de 5 fotos adicionadas</strong><span>Todas obrigatórias</span></div>
                <div className="troca-photo-grid">{FOTOS_TROCA.map(foto => <Controller key={foto.campo} control={control} name={`fotos.${foto.campo}`}
                  rules={{ validate: validarFoto }} render={({ field, fieldState }) => <FotoSlot foto={foto} arquivo={field.value} nome={field.name}
                    inputRef={field.ref} onBlur={field.onBlur} onChange={valor => { field.onChange(valor); if (valor) trigger(field.name); }} erro={fieldState.error?.message} />} />)}</div>
              </section>
              <section className="troca-panel" hidden={passo !== 2} aria-label="Descrição e IMEI">
                <label className="troca-field" htmlFor="descricaoEstado">Descreva o estado do aparelho (arranhões, bateria, acessórios...)
                  <textarea id="descricaoEstado" rows={5} maxLength={4000} placeholder="Ex.: tela sem riscos, bateria com 87% de saúde, acompanha caixa e carregador…"
                    {...atributos('descricaoEstado')} {...register('descricaoEstado', { maxLength: { value: 4000, message: 'Use no máximo 4.000 caracteres.' } })} />
                </label><ErroCampo nome="descricaoEstado" errors={errors} />
                <p className="troca-help troca-character-count">{(dados.descricaoEstado || '').length}/4.000 caracteres · opcional</p>
                <label className="troca-field" htmlFor="imei">IMEI <span>*</span>
                  <input id="imei" type="text" inputMode="numeric" maxLength={15} placeholder="Digite os 15 dígitos do IMEI" autoComplete="off"
                    {...atributos('imei')} {...register('imei', { required: 'Informe o IMEI do aparelho.', validate: validarImei })} />
                </label><ErroCampo nome="imei" errors={errors} />
                <div className="troca-imei-tip"><PhoneIcon aria-hidden="true" /><p><strong>Como obter o IMEI:</strong> abra o app Telefone, digite <b>*#06#</b> no teclado e ligue. O número aparecerá na tela.</p></div>
              </section>
              <section className="troca-panel" hidden={passo !== 3} aria-label="Confirmação">
                <div className="troca-summary-header"><h3>Seu aparelho</h3><button type="button" onClick={() => mudarPasso(0)}>Editar aparelho</button></div>
                <dl className="troca-summary"><div><dt>Modelo</dt><dd>{dados.modeloAparelho}</dd></div><div><dt>Capacidade</dt><dd>{dados.capacidade}</dd></div>
                  <div><dt>Cor</dt><dd>{dados.cor}</dd></div><div><dt>IMEI</dt><dd>{dados.imei}</dd></div></dl>
                <div className="troca-summary-header"><h3>Estado do aparelho</h3><button type="button" onClick={() => mudarPasso(2)}>Editar descrição e IMEI</button></div>
                <p className="troca-summary-description">{dados.descricaoEstado?.trim() || 'Nenhuma descrição adicional informada.'}</p>
                <div className="troca-summary-header"><h3>Fotos para avaliação</h3><button type="button" onClick={() => mudarPasso(1)}>Editar fotos</button></div>
                <div className="troca-summary-photos">{FOTOS_TROCA.map(({ campo, label }) => <figure key={campo}>
                  {fotos[campo] && <FotoPreview arquivo={fotos[campo]} label={label} />}<figcaption>{label}</figcaption></figure>)}</div>
                <div className="troca-contact"><h3>Dados para contato</h3><p>{user ? 'Preenchemos seus dados de perfil. Confira antes de enviar.' : 'Informe seus dados para receber nossa avaliação.'}</p>
                  {carregandoUsuario && <p className="troca-notice" role="status">Carregando seus dados de perfil…</p>}
                  {erroUsuario && <div className="troca-notice troca-notice-error" role="alert"><p>{erroUsuario}</p>
                    <button type="button" onClick={recarregarUsuario}>Tentar novamente</button><button type="button" onClick={sair}>Continuar sem login</button></div>}
                  <label className="troca-field" htmlFor="nome">Nome <span>*</span><input id="nome" autoComplete="name" maxLength={120} {...atributos('nome')}
                    {...register('nome', { required: 'Informe seu nome.', validate: valor => valor.trim().length >= 2 || 'Informe seu nome com pelo menos 2 caracteres.',
                      maxLength: { value: 120, message: 'Use no máximo 120 caracteres.' } })} /></label><ErroCampo nome="nome" errors={errors} />
                  <div className="troca-fields-row"><div><label className="troca-field" htmlFor="email">Email <span>*</span><input id="email" type="email" autoComplete="email" maxLength={254}
                    {...atributos('email')} {...register('email', { required: 'Informe seu email.', setValueAs: valor => valor.trim(), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Informe um email válido.' }, maxLength: 254 })} />
                  </label><ErroCampo nome="email" errors={errors} /></div>
                    <div><label className="troca-field" htmlFor="telefone">Telefone <span>*</span><input id="telefone" type="tel" autoComplete="tel" maxLength={25} placeholder="(11) 99999-9999"
                      {...atributos('telefone')} {...register('telefone', { required: 'Informe seu telefone com DDD.', validate: valor => /^\+?[\d\s().-]+$/.test(valor) && /^\d{10,13}$/.test(valor.replace(/\D/g, '')) || 'Informe um telefone válido com DDD.', maxLength: 25 })} />
                    </label><ErroCampo nome="telefone" errors={errors} /></div></div>
                </div>
                <div className="troca-inline-tip"><ClockIcon /><p>Ao enviar, sua troca ficará <strong>pendente</strong>. Nossa equipe entrará em contato em até <strong>24h</strong>.</p></div>
              </section>
            </fieldset>
            {erroEnvio && <div className="troca-notice troca-notice-error" role="alert"><p>{erroEnvio}</p>
              {sessaoExpirada && token && <button type="button" onClick={() => { sair(); setSessaoExpirada(false); setErroEnvio(''); }}>Continuar sem login</button>}</div>}
            {enviando && <div className="troca-send-status" role="status"><p>{progresso < 100 ? `Enviando fotos… ${progresso}%` : 'Fotos enviadas. Confirmando sua solicitação…'}</p><progress max="100" value={progresso} aria-label="Envio das fotos" /></div>}
            <div className="troca-form-actions"><span className="troca-required-note">* Campos obrigatórios</span>
              <div>{passo > 0 && <button className="troca-button troca-button-secondary" type="button" disabled={enviando} onClick={() => mudarPasso(passo - 1)}><ArrowLeftIcon /> Voltar</button>}
                <button type="submit" className="troca-button troca-button-primary" disabled={enviando || passo === 0 && (catalogo.carregando || Boolean(catalogo.erro)) || passo === 3 && (carregandoUsuario || Boolean(erroUsuario))}>
                  {enviando ? 'Enviando…' : passo === 3 ? 'Enviar para avaliação' : 'Continuar'}{!enviando && <ArrowRightIcon />}
                </button></div>
            </div>
          </form>
          <aside className="troca-aside"><div className="troca-aside-icon"><ArrowPathRoundedSquareIcon /></div><span className="troca-eyebrow">SEU PRÓXIMO UPGRADE</span>
            <h2>Mais possibilidades.<br />{' '}<span>Um novo começo.</span></h2><p>Transforme o aparelho que você já tem no primeiro passo para o seu próximo.</p>
            <ul><li><ClockIcon /><div><strong>Retorno em até 24h</strong><span>Nossa equipe cuida da sua avaliação.</span></div></li>
              <li><ShieldCheckIcon /><div><strong>Avaliação com cuidado</strong><span>Fotos e detalhes para analisar seu aparelho.</span></div></li>
              <li><PhoneIcon /><div><strong>Atendimento de verdade</strong><span>Falamos com você pelos dados informados.</span></div></li></ul>
            <div className="troca-aside-bottom"><span>PLACETECH</span><span>Tecnologia para o seu próximo passo.</span></div>
          </aside>
        </div>
      </>}
    </main>
    <footer className="troca-footer troca-wrap"><span>© {new Date().getFullYear()} Placetech</span><span>Seu aparelho merece um novo ciclo.</span></footer>
  </div>;
}
