import { useState } from 'react';
import { useCarrinho } from '../context/CarrinhoContext';
import api from '../services/api';
import { XMarkIcon, ShoppingCartIcon, DocumentTextIcon, UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

// CORES OFICIAIS
const AMARELO = '#F9D828';
const AZUL = '#3483FA';
const VERDE = '#00A650';
const PRETO = '#000000';

export default function Carrinho({ aberto, fechar }) {
  const { itens, remover, alterarQuantidade, limpar } = useCarrinho();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  // ✅ DEBUG: mostra se o carrinho recebeu a prop corretamente
  console.log("🛒 Carrinho recebeu aberto =", aberto);

  if (!aberto) return null;

  // Formata telefone
  const formatarTelefone = (valor) => {
    const nums = valor.replace(/\D/g, '');
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7,11)}`;
  };

  // Calcula total
  const total = itens.reduce((s, i) => s + (i.precoExibicao || i.preco) * i.quantidade, 0);

  // ✅ FUNÇÃO ÚNICA E CORRETA — NÃO DUPLICA MAIS!
  const enviarPedido = async () => {
    console.log("📤 Botão Enviar clicado!");

    // 1️⃣ VALIDAÇÃO
    if (!nome.trim() || !telefone.trim()) {
      alert('⚠️ Preencha nome e telefone!');
      return;
    }

    setSalvando(true);

    try {
      // 2️⃣ PREPARA DADOS
      const dadosPedido = {
        itens: itens.map(i => ({
          _id: i._id,
          nome: i.nome,
          preco: i.precoExibicao || i.preco,
          quantidade: i.quantidade,
          imagem: i.imagem || ''
        })),
        total: total,
        dadosCliente: {
          nome: nome.trim() || 'Nome não informado',
          telefone: telefone.trim() || 'Telefone não informado',
          endereco: endereco.trim() || 'Endereço não informado'
        },
        status: 'pendente'
      };

      console.log("📤 Enviando para API:", dadosPedido);

      // 3️⃣ SALVA NO BANCO
      const resposta = await api.post('/pedidos', dadosPedido);
      console.log("✅ Pedido salvo no banco!", resposta.data);

      // 4️⃣ ABRE WHATSAPP
      const lista = itens.map(i => 
        `✅ ${i.nome} — ${i.quantidade}x — R$ ${((i.precoExibicao || i.preco) * i.quantidade).toFixed(2).replace('.', ',')}`
      ).join('\n');

      const mensagem = `🛒 NOVO PEDIDO PLACETECH\n\n${lista}\n\n💰 Total: R$ ${total.toFixed(2).replace('.', ',')}\n\n📋 DADOS DO CLIENTE:\n👤 Nome: ${nome}\n📱 Telefone: ${telefone}\n📍 Endereço: ${endereco || 'Não informado'}`;

      // ⚠️ TROQUE PELO SEU NÚMERO REAL DO WHATSAPP
      const link = `https://wa.me/551938983284?text=${encodeURIComponent(mensagem)}`;
      window.open(link, '_blank');

      // 5️⃣ LIMPA E FECHA
      limpar();
      fechar();

    } catch (erro) {
      console.error("❌ Erro ao salvar pedido:", erro.response?.data || erro.message);
      alert("Não foi possível salvar o pedido! Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      {/* ✅ FUNDO ESCURO — Z-INDEX MUITO ALTO */}
      <div 
        onClick={fechar} 
        style={{
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 9998  // ✅ AUMENTEI
        }} 
      />

      {/* ✅ PAINEL DO CARRINHO — Z-INDEX MAIOR QUE TUDO */}
      <div style={{
        position: 'fixed', 
        top: 0, 
        right: 0, 
        height: '100vh', 
        width: '420px',
        backgroundColor: 'white', 
        zIndex: 9999,  // ✅ O MAIOR DE TODOS!
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 20px', 
          backgroundColor: AMARELO,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <h4 style={{margin: 0, fontSize: '18px', fontWeight: 700, color: PRETO}}>
            🛒 Meu Carrinho
          </h4>
          <button onClick={fechar} style={{border: 'none', background: 'transparent', cursor: 'pointer'}}>
            <XMarkIcon style={{width: '22px', height: '22px', color: PRETO}} />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
          {itens.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px 20px', color: '#666'}}>
              <ShoppingCartIcon style={{width: '48px', height: '48px', margin: '0 auto 16px', color: '#ccc'}} />
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {/* Lista de itens */}
              {itens.map(item => (
                <div key={item._id} style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{flex: 1}}>
                    <h5 style={{margin: 0, fontSize: '15px', fontWeight: 500}}>{item.nome}</h5>
                    <p style={{margin: '4px 0 0 0', fontSize: '14px', color: AZUL, fontWeight: 700}}>
                      R$ {Number(item.precoExibicao || item.preco).toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Quantidade com botões */}
                  <div style={{display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px'}}>
                    <button
                      onClick={() => alterarQuantidade(item._id, item.quantidade - 1)}
                      style={{border: 'none', background: '#f5f5f5', padding: '4px 10px', cursor: 'pointer', fontSize: '16px'}}
                    >−</button>
                    <span style={{padding: '4px 12px', fontWeight: 600}}>{item.quantidade}</span>
                    <button
                      onClick={() => alterarQuantidade(item._id, item.quantidade + 1)}
                      style={{border: 'none', background: '#f5f5f5', padding: '4px 10px', cursor: 'pointer', fontSize: '16px'}}
                    >+</button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 0', 
                borderBottom: '2px solid #eee', 
                margin: '8px 0'
              }}>
                <span style={{fontSize: '16px', fontWeight: 500}}>Total do Pedido</span>
                <span style={{fontSize: '20px', fontWeight: 700, color: AZUL}}>
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Formulário de Dados */}
              <div style={{marginTop: '16px'}}>
                <h5 style={{
                  fontSize: '17px', 
                  fontWeight: 700, 
                  marginBottom: '16px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px'
                }}>
                  <DocumentTextIcon style={{width: '20px', height: '20px', color: AZUL}} />
                  Seus Dados
                </h5>

                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div style={{position: 'relative'}}>
                    <UserIcon style={{
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      width: '18px', 
                      height: '18px', 
                      color: '#999'
                    }} />
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      style={{
                        width: '100%', 
                        padding: '12px 12px 12px 40px',
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{position: 'relative'}}>
                    <PhoneIcon style={{
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      width: '18px', 
                      height: '18px', 
                      color: '#999'
                    }} />
                    <input
                      type="text"
                      placeholder="Telefone com DDD"
                      value={telefone}
                      onChange={e => setTelefone(formatarTelefone(e.target.value))}
                      maxLength={15}
                      style={{
                        width: '100%', 
                        padding: '12px 12px 12px 40px',
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{position: 'relative'}}>
                    <MapPinIcon style={{
                      position: 'absolute', 
                      left: '12px', 
                      top: '14px',
                      width: '18px', 
                      height: '18px', 
                      color: '#999'
                    }} />
                    <textarea
                      placeholder="Endereço completo"
                      value={endereco}
                      onChange={e => setEndereco(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%', 
                        padding: '12px 12px 12px 40px',
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Botão Enviar */}
              <button
                onClick={enviarPedido}
                disabled={salvando}
                style={{
                  width: '100%', 
                  marginTop: '20px', 
                  padding: '14px',
                  backgroundColor: salvando ? '#888' : VERDE, 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => !salvando && (e.target.style.backgroundColor = '#008C45')}
                onMouseOut={e => !salvando && (e.target.style.backgroundColor = VERDE)}
              >
                {salvando ? '⏳ Salvando...' : '📲 Enviar via WhatsApp'}
              </button>

              <p style={{textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '10px'}}>
                Você será redirecionado para o WhatsApp
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}