import { useState } from 'react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { parseListaPrecos } from '../utils/parseListaPrecos';
import api from '../services/api';

export default function ImportadorPrecos({ isOpen, onClose, onSucesso }) {
  const [texto, setTexto] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [erros, setErros] = useState([]);
  const [percentual, setPercentual] = useState(7);
  const [valorFixo, setValorFixo] = useState(500);
  const [adicionados, setAdicionados] = useState([]);
  const [atualizarExistentes, setAtualizarExistentes] = useState(true);

  const fechar = () => {
    setTexto('');
    setProdutos([]);
    setAdicionados([]);
    setErros([]);
    onClose();
  };

  const calcularPreco = (custo) => parseFloat((Number(custo) * (1 + Number(percentual || 0) / 100) + Number(valorFixo || 0)).toFixed(2));

  const aplicarFormula = () => {
    setProdutos(produtos.map((produto) => ({ ...produto, precoFinal: calcularPreco(produto.preçoCusto) })));
  };

  // Etapa 1: Parsear a lista
  const handleParsear = async () => {
    if (!texto.trim()) {
      alert('Cole a lista de preços primeiro!');
      return;
    }

    setProcessando(true);
    setErros([]);

    try {
      const produtosParsados = parseListaPrecos(texto, { percentual, valorFixo });

      if (produtosParsados.length === 0) {
        alert('❌ Nenhum produto encontrado. Verifique o formato da lista.');
        setProcessando(false);
        return;
      }

      // Não busca imagens aqui - o backend fará isso
      setProdutos(produtosParsados);
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

    if (!window.confirm(atualizarExistentes ? `Atualizar somente os preços dos produtos existentes? Itens não cadastrados serão ignorados.` : `Salvar ${produtos.length} produtos? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setSalvando(true);
    setProgresso({ atual: 0, total: produtos.length });
    try {
      // Prepara os dados para enviar ao backend
      const dadosProdutos = produtos.map(produto => ({
        nome: produto.nome.trim(),
        categoria: produto.categoria || 'Importado',
        preco: produto.preçoCusto,
        precoPersonalizado: produto.precoFinal,
        descricao: produto.descricao || '',
        imagem: produto.imagem || '',
        disponivel: produto.disponivel
      }));

      // Envia em um único request (o backend processa em lotes)
      const response = await api.post(atualizarExistentes ? '/produtos/atualizar-precos-lote' : '/produtos/importar-lote', {
        produtos: dadosProdutos,
        atualizarExistentes
      });
      const resultados = response.data.resultados;

      if (!resultados) {
        throw new Error('O servidor não retornou o resultado da importação.');
      }

      if (resultados.erros.length > 0) {
        setErros(resultados.erros);
        alert(`⚠️ ${resultados.sucesso.length}/${resultados.total} salvos.\n\nErros:\n${resultados.erros.slice(0, 3).map(e => `${e.nome}: ${e.erro}`).join('\n')}`);
      } else {
        alert(`${resultados.sucesso.length} produto(s) salvo(s). ${resultados.ignorados?.length || 0} item(ns) não cadastrado(s) ignorado(s).`);
      }

      setProgresso({ atual: produtos.length, total: produtos.length });

      const produtosAdicionados = resultados?.sucesso?.map((resultado) => ({
        ...produtos[resultado.indice],
        id: resultado.id,
        nome: resultado.nome
      })) || [];
      setAdicionados(produtosAdicionados);
      setProdutos([]);
      onSucesso?.();

    } catch (erro) {
      console.error('Erro ao salvar:', erro);
      alert('❌ Erro ao enviar produtos ao servidor!');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface-2 px-5 py-5 text-primary sm:px-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <span className="h-2 w-2 rounded-full bg-surface" /> Cadastro em lote
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">Importar preços</h2>
            <p className="mt-1 text-sm text-secondary">Cole a lista do fornecedor, revise os dados e confirme o cadastro.</p>
          </div>
          <button onClick={fechar} aria-label="Fechar importador" className="rounded-lg p-2 text-secondary transition hover:bg-surface/10 hover:text-primary">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface p-4 sm:p-7">
          {adicionados.length > 0 ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-line bg-surface p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand">Importação concluída</p>
                <h3 className="mt-1 text-xl font-bold text-brand">{adicionados.length} produtos adicionados ao catálogo</h3>
                <p className="mt-1 text-sm text-brand">Os preços abaixo já foram salvos com a fórmula atual.</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-line bg-surface px-4 py-3 text-xs font-bold uppercase tracking-wide text-secondary"><span>Produto</span><span>Preço de venda</span></div>
                <div className="max-h-[calc(100vh-22rem)] divide-y divide-slate-100 overflow-y-auto">
                  {adicionados.map((produto, indice) => <div key={produto.id || indice} className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3"><div><p className="font-semibold text-primary">{produto.nome}</p><p className="text-xs text-secondary">Custo: R$ {Number(produto.preçoCusto).toFixed(2).replace('.', ',')}</p></div><p className="font-bold text-brand">R$ {Number(produto.precoFinal).toFixed(2).replace('.', ',')}</p></div>)}
                </div>
              </div>
              <div className="flex justify-end"><button onClick={fechar} className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-base transition hover:bg-brand-hover">Concluir</button></div>
            </div>
          ) : produtos.length === 0 ? (
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-lg bg-surface p-2 text-brand">📋</div>
                  <div>
                    <label className="block text-base font-semibold text-primary">Lista de preços do fornecedor</label>
                    <p className="mt-1 text-sm text-secondary">Cole aqui a mensagem completa, incluindo produtos, cores e preços.</p>
                  </div>
                </div>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Cole a mensagem do fornecedor aqui..."
                  className="h-64 w-full resize-y rounded-lg border border-line bg-surface p-4 font-mono text-sm text-primary outline-none transition placeholder:text-secondary focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/20"
                />
                <div className="mt-4 rounded-lg border border-line bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Regra de preço de venda</p><p className="text-xs text-secondary">Aplicada sobre o preço de custo de cada produto.</p></div><span className="text-xs font-semibold text-brand">custo + margem + fixo</span></div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-secondary">Margem percentual<input type="number" min="0" step="0.1" value={percentual} onChange={(e) => setPercentual(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label><label className="text-xs font-semibold text-secondary">Valor fixo (R$)<input type="number" min="0" step="0.01" value={valorFixo} onChange={(e) => setValorFixo(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label></div>
                  <p className="mt-3 text-xs text-secondary">Exemplo: custo R$ 1.000, margem {percentual}% + R$ {Number(valorFixo || 0).toFixed(2)} = R$ {calcularPreco(1000).toFixed(2).replace('.', ',')}</p>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3 text-sm text-primary"><input type="checkbox" checked={atualizarExistentes} onChange={(e) => setAtualizarExistentes(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" /><span><strong className="block text-primary">Atualizar somente preços de produtos existentes</strong><span className="text-xs text-secondary">Atualiza custo e preço de venda pelo nome completo. Preserva os demais dados e ignora itens não cadastrados.</span></span></label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-secondary">Os dados poderão ser editados antes do cadastro.</span>
                  <button
                    onClick={handleParsear}
                    disabled={processando || !texto.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-base shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-secondary"
                  >
                    {processando ? <><span className="animate-spin">⏳</span> Processando...</> : <><CheckIcon className="h-5 w-5" /> Analisar lista</>}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-surface p-4"><strong className="block text-sm text-primary">1. Cole</strong><span className="mt-1 block text-xs text-secondary">Use a mensagem original do fornecedor.</span></div>
                <div className="rounded-xl border border-line bg-surface p-4"><strong className="block text-sm text-primary">2. Revise</strong><span className="mt-1 block text-xs text-secondary">Confira nomes, categorias e preços.</span></div>
                <div className="rounded-xl border border-line bg-surface p-4"><strong className="block text-sm text-primary">3. Confirme</strong><span className="mt-1 block text-xs text-secondary">Imagens são buscadas automaticamente.</span></div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-bold text-brand">{produtos.length} produtos encontrados</p><p className="text-sm text-brand">Revise os dados antes de confirmar a importação.</p></div>
                <button onClick={() => setProdutos([])} className="text-left text-sm font-semibold text-brand hover:text-brand sm:text-right">← Voltar e colar outra lista</button>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end sm:justify-between"><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-secondary">Margem (%)<input type="number" min="0" step="0.1" value={percentual} onChange={(e) => setPercentual(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand" /></label><label className="text-xs font-semibold text-secondary">Fixo (R$)<input type="number" min="0" step="0.01" value={valorFixo} onChange={(e) => setValorFixo(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand" /></label></div><button onClick={aplicarFormula} className="rounded-lg border border-brand px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-surface">Atualizar preços</button></div>

              <div className="space-y-3">
                {produtos.map((produto, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-surface p-4 shadow-sm transition hover:border-line sm:p-5">
                    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-secondary">Produto {String(idx + 1).padStart(2, '0')}</span><button onClick={() => removerProduto(idx)} aria-label={`Remover ${produto.nome}`} className="text-sm font-semibold text-brand hover:text-brand">Remover</button></div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="block text-xs font-semibold text-secondary md:col-span-2">Nome<input type="text" value={produto.nome} onChange={(e) => editarProduto(idx, 'nome', e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label>
                      <label className="block text-xs font-semibold text-secondary">Categoria<input type="text" value={produto.categoria} onChange={(e) => editarProduto(idx, 'categoria', e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label>
                      <label className="block text-xs font-semibold text-secondary">Preço final<input type="number" value={produto.precoFinal} onChange={(e) => editarProduto(idx, 'precoFinal', parseFloat(e.target.value))} step="0.01" className="mt-1 w-full rounded-lg border border-line p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label>
                      <label className="block text-xs font-semibold text-secondary md:col-span-2">URL da imagem (opcional)<input type="text" value={produto.imagem} onChange={(e) => editarProduto(idx, 'imagem', e.target.value)} placeholder="Será buscada automaticamente se ficar vazio" className="mt-1 w-full rounded-lg border border-line p-2.5 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label>
                    </div>
                  </div>
                ))}
              </div>

              {erros.length > 0 && <div className="rounded-xl border border-line bg-surface p-4 text-sm text-brand"><p className="mb-2 flex items-center gap-2 font-semibold"><ExclamationTriangleIcon className="h-5 w-5" /> Erros encontrados</p><ul className="space-y-1">{erros.slice(0, 5).map((erro, i) => <li key={i}>• {erro.nome}: {erro.erro}</li>)}</ul></div>}
            </div>
          )}
        </div>

        {produtos.length > 0 && <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-line bg-surface p-4 sm:flex-row sm:justify-end sm:p-5">
          <button onClick={() => setProdutos([])} className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-primary transition hover:bg-surface">Voltar</button>
          <button onClick={handleSalvarTodos} disabled={salvando || produtos.length === 0} className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-base shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-secondary">{salvando ? `Salvando... (${progresso.atual}/${progresso.total})` : `Confirmar importação (${produtos.length})`}</button>
        </footer>}
      </div>
    </div>
  );
}
