import { BoltIcon } from '@heroicons/react/24/solid'; // ícone de raio

const AMARELO = '#F9D828';
const PRETO = '#000000';

export default function LogoPlacetech({ altura = '42px' }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0px',
      height: altura,
      fontFamily: 'Roboto, -apple-system, sans-serif',
      fontWeight: 900,
      fontSize: `calc(${altura} * 0.75)`,
      lineHeight: 1,
    }}>
      {/* Ícone de Raio em Amarelo */}
      <BoltIcon style={{
        width: `calc(${altura} * 0.85)`,
        height: `calc(${altura} * 0.85)`,
        color: AMARELO,
        transform: 'scaleX(0.85)', /* ajusta largura do raio */
        marginRight: '2px',
      }} />

      {/* Texto: "placetech" em Preto */}
      <span style={{
        color: PRETO,
        letterSpacing: '-0.03em', /* letras mais próximas */
        textTransform: 'lowercase',
      }}>
        placetech
      </span>
    </div>
  );
}