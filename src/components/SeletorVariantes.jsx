import { ordenarCapacidades, varianteDisponivel } from '../utils/variantes';
import './Variantes.css';

const CORES = {
  Prata: '#cbd0d5', 'Deep Blue': '#243952', 'Cosmic Orange': '#d9763c',
  'Titânio Natural': '#aaa296', 'Titânio Deserto': '#c9ac91', 'Titânio Preto': '#363536',
  'Titânio Branco': '#e9e5e0', 'Titânio Azul': '#4b5970', Preto: '#292929', Branco: '#eee',
  Azul: '#5d92c3', Verde: '#779681', Rosa: '#e2b8c7', Roxo: '#9481b1', Dourado: '#cdb57f',
  Cinza: '#83878e', Vermelho: '#bb4347', Amarelo: '#dbcf80', 'Meia-noite': '#282c38',
  Estelar: '#ded7c8', Laranja: '#e9863c', 'Dourado Claro': '#e5d8ba', 'Verde Sage': '#bcc7b2',
  'Preto Jateado': '#252527', 'Cinza Espacial': '#64666b', 'Azul Céu': '#a7c2dc', 'Azul Índigo': '#495379'
};

export default function SeletorVariantes({ produto, variante, onChange, permitirIndisponiveis = false }) {
  const variantes = produto.variants || [];
  const disponivel = v => permitirIndisponiveis || varianteDisponivel(v);
  const cor = variante?.cor || '';
  const cores = [...new Set(variantes.map(v => v.cor))];
  const capacidades = ordenarCapacidades([...new Set(variantes.map(v => v.capacidade))]);
  const escolherCor = valor => {
    const opcoes = variantes.filter(v => v.cor === valor);
    const proxima = opcoes.find(v => v.capacidade === variante?.capacidade && disponivel(v)) || opcoes.find(disponivel);
    if (proxima) onChange(proxima);
  };
  return <div role="region" aria-label={`Seleção de ${produto.nome}`}>
    <fieldset className="variant-choices"><legend>Cor: {cor || 'selecione'}</legend>
      <div className="variant-options">{cores.map(valor => <button type="button" key={valor} className="variant-option"
        aria-pressed={cor === valor} disabled={!variantes.some(v => v.cor === valor && disponivel(v))} onClick={() => escolherCor(valor)}>
        <span className="variant-swatch" aria-hidden="true" style={{ background: CORES[valor] || 'linear-gradient(135deg,#777,#bbb)' }} />{valor}
      </button>)}</div>
    </fieldset>
    <fieldset className="variant-choices"><legend>Capacidade</legend>
      <div className="variant-options">{capacidades.map(valor => <button type="button" key={valor} className="variant-option"
        aria-pressed={variante?.capacidade === valor} disabled={!variantes.some(v => v.cor === cor && v.capacidade === valor && disponivel(v))}
        onClick={() => onChange(variantes.find(v => v.cor === cor && v.capacidade === valor && disponivel(v)))}>{valor}</button>)}</div>
    </fieldset>
  </div>;
}
