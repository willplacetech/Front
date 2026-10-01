import './Variantes.css';
import { ordenarCapacidades } from '../utils/variantes';

const CAMPOS = [
  ['marca', 'Marca', 'marcas'], ['categoria', 'Categoria', 'categorias'],
  ['modelo', 'Modelo', 'modelos'], ['cor', 'Cor', 'cores'], ['capacidade', 'Capacidade', 'capacidades']
];

export default function FiltrosCatalogo({ filtros, opcoes, onChange, onLimpar }) {
  return (
    <div className="variant-filters" aria-label="Filtros do catálogo">
      {CAMPOS.map(([campo, label, lista]) => {
        const valores = campo === 'capacidade' ? ordenarCapacidades(opcoes[lista] || []) : (opcoes[lista] || []);
        return <label key={campo} className="variant-filter-label">
          {label}
          <select value={filtros[campo] || ''} onChange={event => onChange(campo, event.target.value)}>
            <option value="">{campo === 'modelo' ? 'Todos' : 'Todas'}</option>
            {valores.map(valor => <option key={valor} value={valor}>{valor}</option>)}
          </select>
        </label>;
      })}
      <button type="button" className="variant-clear" onClick={onLimpar}>Limpar filtros</button>
    </div>
  );
}
