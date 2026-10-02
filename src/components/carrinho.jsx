import { useState } from 'react';
import { useCarrinho } from '../context/carrinho';
import api from '../services/api';
import { creditoDaTroca, tokenDaTroca, valorFinal } from '../utils/comparar';
import { moeda } from '../utils/variantes';
import { XMarkIcon, ShoppingCartIcon, DocumentTextIcon, UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function Carrinho({ aberto, fechar }) {
  const { itens, alterarQuantidade, limpar, troca, associarTroca } = useCarrinho();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  // Formata telefone
  const formatarTelefone = (valor) => {
    const nums = valor.replace(/\D/g, '');
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7,11)}`;
  };

  // Calcula total
  const total = itens.reduce((s, i) => s + (i.precoPersonalizado || i.preco) * i.quantidade, 0);
  const credito = creditoDaTroca(troca);
  const totalComTroca = valorFinal(total, credito);

  // ✅ FUNÇÃO ÚNICA E CORRETA — NÃO DUPLICA MAIS!
  const enviarPedido = async () => {
    // 1️⃣ VALIDAÇÃO
    if (!nome.trim() || !telefone.trim()) {
      alert('⚠️ Preencha nome e telefone!');
      return;
    }

    setSalvando(true);

    try {
      // 2️⃣ PREPARA DADOS
      const dadosPedido = {
        ...(troca ? { tradeInId: troca._id } : {}),
        itens: itens.map(i => ({
          produtoId: i.produtoId || i._id,
          variantId: i.variantId,
          sku: i.sku,
          nome: i.nome,
          preco: i.precoPersonalizado || i.preco,
          quantidade: i.quantidade,
          imagem: i.imagem || ''
        })),
        total: totalComTroca,
        dadosCliente: {
          nome: nome.trim() || 'Nome não informado',
          telefone: telefone.trim() || 'Telefone não informado',
          endereco: endereco.trim() || 'Endereço não informado'
        },
        status: 'pendente'
      };

      const resposta = await api.post('/pedidos', dadosPedido, {
        headers: troca ? { 'X-Troca-Token': tokenDaTroca(troca._id) } : {}
      });
      const totalConfirmado = resposta.data.pedido.total;

      // 4️⃣ ABRE WHATSAPP
      const lista = resposta.data.pedido.itens.map(i =>
        `✅ ${i.nome} — ${i.quantidade}x${i.sku ? ` · SKU: ${i.sku}` : ''}`
      ).join('\n');

      const resumoTroca = resposta.data.pedido.tradeInId ? `\nTroca: ${resposta.data.pedido.tradeInId}\nCrédito de troca: ${moeda(resposta.data.pedido.valorTroca)}` : '';
      const mensagem = `🛒 NOVO PEDIDO PLACETECH\n\n${lista}${resumoTroca}\n\n💰 Total: R$ ${totalConfirmado.toFixed(2).replace('.', ',')}\n\n📋 DADOS DO CLIENTE:\n👤 Nome: ${nome}\n📱 Telefone: ${telefone}\n📍 Endereço: ${endereco || 'Não informado'}`;

      // ⚠️ TROQUE PELO SEU NÚMERO REAL DO WHATSAPP
      const link = `https://wa.me/551938983284?text=${encodeURIComponent(mensagem)}`;
      window.location.assign(link);

      // 5️⃣ LIMPA E FECHA
      limpar();
      fechar();

    } catch (erro) {
      console.error("❌ Erro ao salvar pedido:", erro.response?.data || erro.message);
      alert(erro.response?.data?.error || "Não foi possível salvar o pedido! Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div
        onClick={fechar}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.58)',
          backdropFilter: 'blur(6px)',
          zIndex: 9998
        }}
      />

      <div role="dialog" aria-modal="true" aria-label="Seu carrinho" style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '440px',
        maxWidth: '100vw',
        background: 'linear-gradient(180deg, #121212 0%, #0b0b0b 100%)',
        zIndex: 9999,
        boxShadow: '-18px 0 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          padding: '18px 22px',
          background: 'linear-gradient(180deg, #f5a400 0%, #e89d00 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 12px 28px rgba(245,164,0,0.18)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'rgba(17,17,17,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingCartIcon style={{ width: 20, height: 20, color: '#111' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#111', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.8 }}>Carrinho</div>
              <h4 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.8px' }}>Meu pedido</h4>
            </div>
          </div>

          <button
            onClick={fechar}
            style={{
              border: 'none',
              background: 'rgba(17,17,17,0.08)',
              cursor: 'pointer',
              width: 38,
              height: 38,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XMarkIcon style={{ width: 20, height: 20, color: '#111' }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          {itens.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px 30px',
              color: '#cfcfc8',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: 22,
              background: 'rgba(255,255,255,0.02)'
            }}>
              <ShoppingCartIcon style={{ width: 52, height: 52, margin: '0 auto 18px', color: '#8d8a83' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f7f7f3' }}>Seu carrinho está vazio</div>
              <div style={{ marginTop: 8, color: '#a3a29d' }}>Adicione alguns itens para continuar.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {itens.map(item => (
                  <div key={item._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{
                      width: 68,
                      height: 68,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      {item.imagem ? (
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <ShoppingCartIcon style={{ width: 26, height: 26, color: '#f5a400' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f7f7f3', lineHeight: 1.3 }}>{item.nome}</div>
                      {item.sku && <div style={{ marginTop: 4, fontSize: 11, color: '#a3a29d' }}>SKU: {item.sku}</div>}
                      <div style={{ marginTop: 6, fontSize: 14, color: '#ffca56', fontWeight: 800 }}>
                        R$ {Number(item.precoPersonalizado || item.preco).toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)'
                    }}>
                      <button
                        onClick={() => alterarQuantidade(item._id, item.quantidade - 1)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#f7f7f3',
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          fontSize: 20,
                          fontWeight: 700
                        }}
                      >−</button>
                      <span style={{ minWidth: 26, textAlign: 'center', fontWeight: 700, color: '#f7f7f3' }}>{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item._id, item.quantidade + 1)}
                        disabled={item.estoque !== null && item.estoque !== undefined && item.quantidade >= item.estoque}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#f7f7f3',
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          fontSize: 20,
                          fontWeight: 700
                        }}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 22,
                padding: '18px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, color: '#c8c5c1' }}>Subtotal</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#f7f7f3' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 15, color: '#c8c5c1' }}>Entrega</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#7de29c' }}>A combinar</span>
                </div>
                {troca && <div style={{ marginTop: 16, color: '#ffca56' }}>
                  <p>Troca associada: {troca.modeloAparelho} · {troca.capacidade} · {troca.cor}</p>
                  <p>Crédito de troca: {credito === null ? 'Em avaliação' : moeda(Math.min(total, credito))}</p>
                  <button type="button" className="variant-clear" onClick={() => associarTroca(null)}>Remover troca do pedido</button>
                </div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#f7f7f3' }}>Total</span>
                  <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.2px', color: '#ffca56' }}>{moeda(totalComTroca)}</span>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <h5 style={{
                  margin: '0 0 16px',
                  color: '#f7f7f3',
                  fontSize: 18,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <DocumentTextIcon style={{ width: 20, height: 20, color: '#ffca56' }} />
                  Dados do cliente
                </h5>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <UserIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#999' }} />
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 42px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#f7f7f3',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ position: 'relative' }}>
                    <PhoneIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#999' }} />
                    <input
                      type="text"
                      placeholder="Telefone com DDD"
                      value={telefone}
                      onChange={e => setTelefone(formatarTelefone(e.target.value))}
                      maxLength={15}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 42px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#f7f7f3',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ position: 'relative' }}>
                    <MapPinIcon style={{ position: 'absolute', left: 14, top: 14, width: 18, height: 18, color: '#999' }} />
                    <textarea
                      placeholder="Endereço completo"
                      value={endereco}
                      onChange={e => setEndereco(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 42px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#f7f7f3',
                        fontSize: 14,
                        resize: 'vertical',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={enviarPedido}
                disabled={salvando}
                style={{
                  width: '100%',
                  marginTop: 22,
                  padding: '16px 18px',
                  background: salvando ? '#555' : 'linear-gradient(180deg, #f5a400 0%, #e89d00 100%)',
                  color: '#111',
                  border: 'none',
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 18px 40px rgba(245,164,0,0.22)'
                }}
              >
                {salvando ? '⏳ Salvando pedido...' : '📲 Enviar via WhatsApp'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#96938d', margin: '12px 0 0' }}>
                Você será redirecionado para o WhatsApp com o pedido completo.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
