export const STATUS_TROCA = {
  pendente: 'Pendente', em_avaliacao: 'Em avaliação', aprovado: 'Aprovado', rejeitado: 'Rejeitado', concluido: 'Concluído'
};
export function dataDaTroca(valor, comHora = false) {
  if (!valor || Number.isNaN(new Date(valor).getTime())) return '—';
  return new Date(valor).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(comHora ? { hour: '2-digit', minute: '2-digit' } : {}) });
}

export function historicoDaTroca(troca) {
  if (troca.historico?.length) {
    // Registros anteriores ao histórico podem conter apenas as decisões novas.
    return troca.historico[0].status === 'pendente' ? troca.historico
      : [{ status: 'pendente', data: troca.createdAt }, ...troca.historico];
  }
  const eventos = [{ status: 'pendente', data: troca.createdAt }];
  if (troca.status !== 'pendente') eventos.push({ status: troca.status, data: troca.updatedAt,
    valorOferta: troca.valorOferta, motivoRejeicao: troca.motivoRejeicao });
  return eventos;
}
