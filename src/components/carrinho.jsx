import { useState } from 'react';
import { useCarrinho } from '../context/CarrinhoContext';
import api from '../services/api';
import { 
  XMarkIcon, PlusIcon, MinusIcon, TrashIcon,
  ShoppingBagIcon, CheckCircleIcon 
} from '@heroicons/react/24/outline';

const TELEFONE_LOJA = '11999999999'; // ⚠️ ALTERE PARA SEU NÚMERO

export default function Carrinho({ onClose }) {
  const { itens, remover, alterarQtd, total, limpar, enviarWhatsapp } = useCarrinho();
  const [cliente, setCliente] = useState({ nome: '', telefone: '', endereco: '' });
  const [finalizado, setFinalizado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const finalizar = async () => {
    if (!cliente.nome.trim() || !cliente.telefone.trim()) {
      alert('Por favor, preencha seu nome e telefone');
      return;
    }
    setEnviando(true);
    try {
      await api.post('/pedidos', {
        cliente,
        itens: itens.map(i => ({
          produtoId: i._id,
          nome: i.nome,
          preco: i.precoExibicao || i.preco,
          quantidade: i.quantidade
        }))
      });
      const link = enviarWhatsapp(TELEFONE_LOJA, cliente);
      window.open(link, '_blank');
      limpar();
      setFinalizado(true);
    } catch (err) {
      alert('Erro ao finalizar pedido');
    }
    setEnviando(false);
  };

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div className="fixed inset-0 z-50" data-theme="minhaLoja">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col" style={{animation: 'slideIn 0.3s ease'}}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div className="bg-gradient-to-r from-primary to-emerald-500 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBagIcon className="w-4 h-4" />
              <div>
                <h2 className="text-xl font-extrabold">Seu Carrinho</h2>
                <p className="text-sm text-white/80">{totalItens} item(ns)</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {finalizado ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-16 h-16 text-success" />
              </div>
              <h3 className="text-2xl font-black text-success mb-3">Pedido Enviado!</h3>
              <p className="text-gray-600 mb-8">
                Seu pedido foi enviado para o nosso WhatsApp. <br/>
                Entraremos em contato em breve! 📱
              </p>
              <button onClick={onClose} className="btn btn-primary btn-wide">Continuar Comprando</button>
            </div>
          ) : itens.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-gray-500">Seu carrinho está vazio</h3>
              <p className="text-gray-400 mt-2">Adicione produtos incríveis!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {itens.map(i => {
                  const preco = i.precoExibicao || i.preco;
                  return (
                    <div key={i._id} className="flex gap-3 p-3 bg-gray-50 rounded-2xl">
                      <img src={i.imagem} alt={i.nome} className="w-20 h-20 object-contain bg-white rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-800 line-clamp-2">{i.nome}</h4>
                        <p className="text-primary font-bold mt-1">R$ {preco.toFixed(2)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-white rounded-full border">
                            <button onClick={() => alterarQtd(i._id, i.quantidade - 1)} className="w-4 h-4 rounded-full hover:bg-gray-100 flex items-center justify-center">
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">{i.quantidade}</span>
                            <button onClick={() => alterarQtd(i._id, i.quantidade + 1)} className="w-4 h-4 rounded-full hover:bg-gray-100 flex items-center justify-center">
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <button onClick={() => remover(i._id)} className="text-error hover:text-error/70 p-1">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-2xl mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">Total do Pedido</span>
                  <span className="text-3xl font-black text-primary">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-700">📋 Seus dados</h3>
                <input placeholder="👤 Seu nome completo" className="input input-bordered w-full rounded-xl"
                  value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} />
                <input placeholder="📱 Telefone com DDD" className="input input-bordered w-full rounded-xl"
                  value={cliente.telefone} onChange={e => setCliente({...cliente, telefone: e.target.value})} />
                <textarea placeholder="📍 Endereço completo" className="textarea textarea-bordered w-full rounded-xl h-20"
                  value={cliente.endereco} onChange={e => setCliente({...cliente, endereco: e.target.value})} />
              </div>
            </>
          )}
        </div>

        {itens.length > 0 && !finalizado && (
          <div className="p-6 border-t bg-white">
            <button onClick={finalizar} disabled={enviando}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {enviando ? <span className="loading loading-spinner loading-md"></span> : <>📱 Enviar via WhatsApp</>}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Você será redirecionado para o WhatsApp</p>
          </div>
        )}
      </div>
    </div>
  );
}