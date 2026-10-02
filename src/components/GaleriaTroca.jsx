import { useEffect, useRef, useState } from 'react';
import { FOTOS_TROCA } from '../utils/troca';

export default function GaleriaTroca({ fotos = {} }) {
  const [ativa, setAtiva] = useState(null);
  const dialog = useRef(null);
  const fotosDisponiveis = FOTOS_TROCA.filter(f => fotos[f.campo]);
  useEffect(() => {
    if (ativa) dialog.current?.showModal();
    else dialog.current?.close();
  }, [ativa]);
  const trocar = incremento => {
    const indice = fotosDisponiveis.findIndex(f => f.campo === ativa.campo);
    setAtiva(fotosDisponiveis[(indice + incremento + fotosDisponiveis.length) % fotosDisponiveis.length]);
  };
  return <>
    <div className="trocas-galeria">{FOTOS_TROCA.map(f => <figure key={f.campo}>
      {fotos[f.campo] ? <button aria-label={`Ampliar ${f.label}`} onClick={() => setAtiva(f)}><img src={fotos[f.campo]} alt={f.label} /></button> : <div className="trocas-foto-ausente">Foto não disponível</div>}
      <figcaption>{f.label}</figcaption>
    </figure>)}</div>
    <dialog ref={dialog} className="trocas-zoom" aria-label="Foto ampliada" onCancel={() => setAtiva(null)} onClose={() => setAtiva(null)}>
      {ativa && <><div className="trocas-zoom-header"><strong>{ativa.label}</strong><button className="trocas-btn" onClick={() => setAtiva(null)}>Fechar</button></div>
        <div className="trocas-zoom-imagem"><img src={fotos[ativa.campo]} alt={ativa.label} /></div>
        <div className="trocas-zoom-acoes"><button className="trocas-btn" onClick={() => trocar(-1)}>Foto anterior</button><button className="trocas-btn" onClick={() => trocar(1)}>Próxima foto</button></div>
      </>}
    </dialog>
  </>;
}
