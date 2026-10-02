import { useEffect, useRef, useState } from 'react';
import { ArrowUpTrayIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { validarConteudoFoto } from '../utils/troca';

export function FotoPreview({ arquivo, label }) {
  const imagem = useRef(null);
  useEffect(() => {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    imagem.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  return <img ref={imagem} className="troca-photo-preview" alt={label} />;
}

function ExemploAngulo({ campo, label }) {
  const frontal = campo === 'frontal';
  const horizontal = campo === 'superior' || campo === 'inferior';
  return <svg className="troca-angle" viewBox="0 0 180 112" role="img" aria-label={`Exemplo visual: ${label}`}>
    <title>{`Exemplo visual: ${label}`}</title>
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      {frontal ? <>
        <rect x="66" y="9" width="48" height="86" rx="9" />
        <rect x="71" y="14" width="38" height="76" rx="5" fill="currentColor" fillOpacity=".05" />
        <path d="M82 18h16M83 85h14" strokeLinecap="round" />
        <path d="m83 49 5 5 10-10" strokeLinecap="round" />
      </> : horizontal ? <>
        <rect x="30" y="39" width="120" height="25" rx="10" />
        {campo === 'inferior' ? <><rect x="79" y="47" width="22" height="9" rx="3" />
          {[46, 53, 60, 120, 127, 134].map(x => <circle key={x} cx={x} cy="51" r="1.5" />)}</>
          : <path d="M43 41v21m94-21v21" />}
        <path d="m90 83 0-9m-5 4 5-5 5 5" strokeLinecap="round" />
      </> : <>
        <rect x="80" y="9" width="20" height="86" rx="8" />
        {campo === 'lateralEsq' ? <path d="M80 24h-3v8h3m0 7h-3v13h3m0 7h-3v13h3" />
          : <path d="M100 32h3v22h-3" />}
        <path d={campo === 'lateralEsq' ? 'M53 51h17m-5-5 5 5-5 5' : 'M127 51h-17m5-5-5 5 5 5'} strokeLinecap="round" />
      </>}
    </g>
  </svg>;
}

export default function FotoSlot({ foto, field, erro }) {
  const [arrastando, setArrastando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState('');
  const versao = useRef(0);
  const profundidade = useRef(0);
  const id = `foto-${foto.campo}`;
  const mensagem = erroArquivo || erro;

  const receber = async arquivos => {
    const atual = ++versao.current;
    field.onChange(null);
    setErroArquivo('');
    if (arquivos.length !== 1) {
      setVerificando(false);
      setErroArquivo('Selecione apenas uma foto para este ângulo.');
      return;
    }
    setVerificando(true);
    const arquivo = arquivos[0];
    const resultado = await validarConteudoFoto(arquivo);
    if (atual !== versao.current) return;
    setVerificando(false);
    if (resultado !== true) setErroArquivo(resultado);
    else field.onChange(arquivo);
  };

  const remover = () => {
    versao.current++;
    field.onChange(null);
    setVerificando(false);
    setErroArquivo('');
  };

  return <div className={`troca-photo-slot ${mensagem ? 'has-error' : ''}`}>
    <div className="troca-photo-title"><span>{foto.label} <span aria-hidden="true">*</span></span>
      {field.value && <CheckCircleIcon aria-label="Foto adicionada" />}
    </div>
    <label htmlFor={id} className={`troca-dropzone ${arrastando ? 'is-dragging' : ''} ${field.value ? 'has-photo' : ''}`}
      onDragEnter={event => { event.preventDefault(); profundidade.current++; setArrastando(true); }}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      onDragLeave={event => { event.preventDefault(); profundidade.current--; if (profundidade.current <= 0) setArrastando(false); }}
      onDrop={event => { event.preventDefault(); profundidade.current = 0; setArrastando(false); receber(event.dataTransfer.files); }}>
      <input id={id} className="troca-file-input" type="file" accept="image/jpeg,image/png,image/webp"
        name={field.name} ref={field.ref} onBlur={field.onBlur} aria-required="true" aria-invalid={Boolean(mensagem)}
        aria-describedby={`${id}-hint${mensagem ? ` ${id}-error` : ''}`}
        onChange={event => { if (event.target.files.length) receber(event.target.files); event.target.value = ''; }} />
      {field.value ? <>
        <FotoPreview arquivo={field.value} label={foto.label} />
        <span className="troca-replace"><ArrowUpTrayIcon /> Trocar foto</span>
      </> : <>
        <ExemploAngulo campo={foto.campo} label={foto.label} />
        <span className="troca-upload-label"><ArrowUpTrayIcon />{verificando ? 'Verificando foto…' : 'Adicionar foto'}</span>
        <span className="troca-drop-hint">ou arraste a imagem aqui</span>
      </>}
    </label>
    <p id={`${id}-hint`} className="troca-photo-hint">{foto.dica}</p>
    {field.value && <div className="troca-file-detail"><span title={field.value.name}>{field.value.name}</span>
      <button type="button" onClick={remover} aria-label={`Remover foto: ${foto.label}`}><XMarkIcon /></button>
    </div>}
    {mensagem && <p className="troca-error" id={`${id}-error`} role="alert">{mensagem}</p>}
  </div>;
}
