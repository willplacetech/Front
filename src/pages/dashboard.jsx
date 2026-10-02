import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LayoutAdmin from '../components/LayoutAdmin';
import {
  ShoppingBagIcon, DocumentTextIcon, ArrowDownTrayIcon,
  XCircleIcon, CheckCircleIcon, ChartBarIcon,
 EyeIcon
} from '@heroicons/react/24/outline';

const AZUL  = 'var(--brand)';
const VERDE = 'var(--brand)';
const VERM  = 'var(--text-secondary)';
const LARJ  = 'var(--brand)';

// ✅ Formata data com segurança — aceita criadoEm ou createdAt
function formatarData(pedido) {
  const raw = pedido.criadoEm || pedido.createdAt;
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const STATUS_CONFIG = {
  pendente:   { bg: 'var(--bg-surface-2)', color: 'var(--brand)', label: 'Pendente',   dot: 'var(--brand)' },
  confirmado: { bg: 'var(--bg-surface-2)', color: 'var(--brand)', label: 'Confirmado', dot: 'var(--brand)' },
  entregue:   { bg: 'var(--bg-surface-2)', color: 'var(--text-secondary)', label: 'Entregue',   dot: 'var(--brand)' },
  cancelado:  { bg: 'var(--bg-surface-2)', color: 'var(--text-secondary)', label: 'Cancelado',  dot: 'var(--text-secondary)' },
};

export default function Dashboard() {
  const [dados, setDados] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/produtos/relatorio'),
      api.get('/pedidos')
    ]).then(([resProd, resPed]) => {
      if (resProd.status === 'fulfilled') setDados(resProd.value.data);
      if (resPed.status === 'fulfilled') {
        setTotalPedidos(resPed.value.data.length);
        setPedidos(resPed.value.data.slice(0, 5));
      }
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Produtos Cadastrados', valor: dados.totalProdutos ?? 0, icon: ShoppingBagIcon, cor: AZUL,  bg: 'var(--bg-surface-2)', desc: 'no catálogo' },
    { label: 'Disponíveis',          valor: dados.disponiveis     ?? 0, icon: CheckCircleIcon,cor: VERDE, bg: 'var(--bg-surface-2)', desc: 'produtos ativos' },
    { label: 'Total de Pedidos',     valor: totalPedidos,               icon: DocumentTextIcon,cor: LARJ, bg: 'var(--bg-surface-2)', desc: 'recebidos' },
    { label: 'Indisponíveis',        valor: dados.indisponiveis   ?? 0, icon: XCircleIcon,    cor: VERM,  bg: 'var(--bg-surface-2)', desc: 'fora do catálogo' },
  ];

  const atalhos = [
    { to: '/loja/produtos', icon: ShoppingBagIcon,   texto: 'Gerenciar Produtos', desc: 'Editar, ativar ou excluir' },
    { to: '/loja/importar', icon: ArrowDownTrayIcon,  texto: 'Cadastrar Produto',  desc: 'Adicionar novo item' },
    { to: '/loja/pedidos',  icon: DocumentTextIcon,   texto: 'Ver Pedidos',        desc: 'Acompanhar e atualizar status' },
    { to: '/loja/relatorios',icon: ChartBarIcon,      texto: 'Relatórios',         desc: 'Análise de dados' },
  ];

  return (
    <LayoutAdmin loading={loading} titulo="Dashboard" subtitulo={`Bem-vindo ao painel Placetech — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`}>

      {/* ── CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {cards.map((card, i) => {
          const Icone = card.icon;
          return (
            <div key={i} className="card-admin" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,165,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,165,36,0.2)' }}>
                  <Icone style={{ width: '22px', height: '22px', color: 'var(--brand)' }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {card.desc}
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{card.valor}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── GRID INFERIOR ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>

        {/* ATALHOS RÁPIDOS */}
        <div className="card-admin" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>⚡ Acesso Rápido</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {atalhos.map(item => {
              const Icone = item.icon;
              return (
                <Link key={item.to} to={item.to} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 14px', borderRadius: '12px', textDecoration: 'none',
                  color: 'var(--text-primary)', transition: 'all 0.15s',
                  border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)'
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(245,165,36,0.06)'; e.currentTarget.style.borderColor = 'rgba(245,165,36,0.25)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245,165,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(245,165,36,0.2)' }}>
                    <Icone style={{ width: '18px', height: '18px', color: 'var(--brand)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.texto}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                  </div>
                  <span style={{ color: 'var(--brand)', fontSize: '18px' }}>›</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ÚLTIMOS PEDIDOS */}
        <div className="card-admin" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>📋 Últimos Pedidos</h2>
            <Link to="/loja/pedidos" style={{
              fontSize: '13px', color: 'var(--brand)', fontWeight: 700, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <EyeIcon style={{ width: '14px', height: '14px' }} /> Ver todos
            </Link>
          </div>

          {pedidos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhum pedido recebido ainda</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {/* HEADER */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 90px 100px',
                padding: '8px 12px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.02)'
              }}>
                <span>Cliente</span>
                <span>Data</span>
                <span style={{ textAlign: 'right' }}>Valor</span>
                <span style={{ textAlign: 'center' }}>Status</span>
              </div>

              {pedidos.map(p => {
                const s = STATUS_CONFIG[p.status] || { bg: 'var(--bg-surface-2)', color: 'var(--text-secondary)', label: p.status, dot: 'var(--text-secondary)' };
                return (
                  <div key={p._id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 90px 100px',
                    padding: '12px 12px', borderRadius: '10px', alignItems: 'center',
                    transition: 'background 0.12s'
                  }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--text-secondary)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.dadosCliente?.nome || 'Cliente'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {p.itens?.length || 0} {p.itens?.length === 1 ? 'item' : 'itens'}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {formatarData(p)}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand)', textAlign: 'right' }}>
                      R$ {Number(p.total).toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        background: s.bg, color: s.color,
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LayoutAdmin>
  );
}
