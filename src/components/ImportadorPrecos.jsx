import { useState } from 'react';
import { XMarkIcon, CheckIcon, ExclamationIcon } from '@heroicons/react/24/outline';
import { parseListaPrecos } from '../utils/parseListaPrecos';
import api from '../services/api';

export default function ImportadorPrecos({ isOpen, onClose, onSucesso }) {
  const [texto, setTexto] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [erros, setErros] = useState([]);

  // Etapa 1: Parsear a lista
  const handleParsear = async () => {
    if (!texto.trim()) {
      alert('Cole a lista de preços primeiro!');
      return;
    }

    setProcessando(true);
    setErros([]);

    try {
      const produtosParsados = parseListaPrecos(texto);
      
      if (produtosParsados.length === 0) {
        alert('❌ Nenhum produto encontrado. Verifique o formato da lista.');
        setProcessando(false);
        return;
      }

      // Não busca imagens aqui - o backend fará isso
      setProdutos(produtosParsados);
      alert(`✅ ${produtosParsados.length} produtos extraídos!\n\nRevise os dados antes de salvar.\nAs imagens serão buscadas automaticamente ao salvar.`);
      setProgresso({ atual: produtosParsados.length, total: produtosParsados.length });

    } catch (erro) {
      console.error('Erro ao parsear:', erro);
      alert('❌ Erro ao processar a lista. Verifique o formato.');
    } finally {
      setProcessando(false);
    }
  };

  // Editar produto antes de salvar
  const editarProduto = (indice, campo, valor) => {
    const novosProdutos = [...produtos];
    novosProdutos[indice][campo] = valor;
    setProdutos(novosProdutos);
  };

  // Remover produto da lista
  const removerProduto = (indice) => {
    setProdutos(produtos.filter((_, i) => i !== indice));
  };

  // Etapa 2: Salvar todos os produtos
  const handleSalvarTodos = async () => {
    if (produtos.length === 0) {
      alert('Nenhum produto para salvar!');
      return;
    }

    // Validação
    const invalidos = produtos.filter(p => !p.nome.trim() || !p.precoFinal);
    if (invalidos.length > 0) {
      alert(`⚠️ ${invalidos.length} produto(s) incompleto(s). Preencha todos os campos.`);
      return;
    }

    if (!window.confirm(`Salvar ${produtos.length} produtos? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setSalvando(true);
    setProgresso({ atual: 0, total: produtos.length });
    const errosList = [];

    try {
      // Prepara os dados para enviar ao backend
      const dadosProdutos = produtos.map(produto => ({
        nome: produto.nome.trim(),
        categoria: produto.categoria || 'Importado',
        preco: produto.precoFinal,
        precoPersonalizado: null,
        descricao: produto.descricao,
        imagem: produto.imagem || '',
        disponivel: produto.disponivel
      }));

      // Envia em um único request (o backend processa em lotes)
      const response = await api.post('/produtos/importar-lote', {
        produtos: dadosProdutos
      });

      if (response.data.resultados) {
        const resultados = response.data.resultados;
        
        if (resultados.erros.length > 0) {
          setErros(resultados.erros);
          alert(`⚠️ ${resultados.sucesso.length}/${resultados.total} salvos.\n\nErros:\n${resultados.erros.slice(0, 3).map(e => `${e.nome}: ${e.erro}`).join('\n')}`);
        } else {
          alert(`✅ ${resultados.sucesso.length} produtos importados com sucesso!`);
        }
      }

      setProgresso({ atual: produtos.length, total: produtos.length });

      // Limpa e fecha
      setTexto('');
      setProdutos([]);
      onSucesso?.();
      onClose();

    } catch (erro) {
      console.error('Erro ao salvar:', erro);
      alert('❌ Erro ao enviar produtos ao servidor!');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
        
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">📊 Importador de Preços</h2>
            <p className="text-blue-100">Cole a lista do fornecedor para cadastrar em lote</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-800 p-2 rounded">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* ETAPA 1: COLAR LISTA */}
          {produtos.length === 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Cole a lista de preços aqui:
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="⌚️🖥️📱 LISTA IPHONE/IPHONE CPO... (cole a mensagem completa)"
                  className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleParsear}
                disabled={processando || !texto.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {processando ? (
                  <>
                    <div className="animate-spin">⏳</div>
                    Processando... ({progresso.atual}/{progresso.total})
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5" /> Analisar Lista
                  </>
                )}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">📝 Formato esperado:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>A lista será parseada automaticamente</li>
                  <li>Preço final = (custo × 1,07) + R$ 500</li>
                  <li>Imagens serão buscadas automaticamente</li>
                  <li>Você poderá revisar antes de confirmar</li>
                </ul>
              </div>
            </div>
          ) : (
            /* ETAPA 2: REVISAR PRODUTOS */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  ✅ {produtos.length} Produtos Extraídos
                </h3>
                <button
                  onClick={() => setProdutos([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Voltar para colagem
                </button>
              </div>

              {/* LISTA DE PRODUTOS */}
              <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50">
                {produtos.map((produto, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={produto.nome}
                        onChange={(e) => editarProduto(idx, 'nome', e.target.value)}
                        placeholder="Nome"
                        className="col-span-2 p-2 border rounded text-sm"
                      />
                      <input
                        type="text"
                        value={produto.categoria}
                        onChange={(e) => editarProduto(idx, 'categoria', e.target.value)}
                        placeholder="Categoria"
                        className="p-2 border rounded text-sm"
                      />
                      <input
                        type="number"
                        value={produto.precoFinal}
                        onChange={(e) => editarProduto(idx, 'precoFinal', parseFloat(e.target.value))}
                        placeholder="Preço Final"
                        className="p-2 border rounded text-sm"
                        step="0.01"
                      />
                      <input
                        type="text"
                        value={produto.imagem}
                        onChange={(e) => editarProduto(idx, 'imagem', e.target.value)}
                        placeholder="URL da imagem"
                        className="col-span-2 p-2 border rounded text-xs"
                      />
                    </div>
                    <button
                      onClick={() => removerProduto(idx)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                    >
                      🗑️ Remover
                    </button>
                  </div>
                ))}
              </div>

              {/* ERROS */}
              {erros.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <ExclamationIcon className="w-5 h-5" /> Erros encontrados:
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {erros.slice(0, 5).map((erro, i) => <li key={i}>• {erro}</li>)}
                  </ul>
                </div>
              )}

              {/* BOTÕES */}
              <div className="flex gap-3">
                <button
                  onClick={handleSalvarTodos}
                  disabled={salvando || produtos.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
                >
                  {salvando ? `💾 Salvando... (${progresso.atual}/${progresso.total})` : `✅ Confirmar & Importar ${produtos.length}`}
                </button>
                <button
                  onClick={() => setProdutos([])}
                  className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg"
                >
                  ↩️ Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
