export interface TutorialSection {
  id: string;
  title: string;
  content: string[];
  tip?: string;
}

export const tutorialSections: TutorialSection[] = [
  {
    id: "visao-geral",
    title: "Visão geral do sistema",
    content: [
      "Este aplicativo é a central de controle dos painéis de LED. Aqui você organiza o conteúdo exibido, acompanha tarefas de manutenção, controla investimentos e campanhas, e visualiza métricas de impacto.",
      "Cada painel tem seu próprio espaço: conteúdo, checklist, financeiro, manutenção e métricas.",
    ],
  },
  {
    id: "conteudo",
    title: "Calendário de Conteúdo",
    content: [
      "Na seção Conteúdo você visualiza e gerencia o que está agendado para cada semana no painel.",
      "A visão de calendário mostra as semanas como colunas e os slots (posições no painel) como linhas.",
      "Conteúdo pode ser da Cassol (institucional/promocional) ou de um Fornecedor (campanha paga).",
      "Para adicionar conteúdo, clique em '+ Novo conteúdo' e preencha as informações incluindo a semana de exibição.",
    ],
    tip: "Use o filtro de painéis para ver conteúdos de múltiplos painéis ao mesmo tempo.",
  },
  {
    id: "financeiro",
    title: "Controle Financeiro",
    content: [
      "Na seção Financeiro você registra os investimentos feitos no painel (materiais, licenças, etc.) e as campanhas pagas por empresas.",
      "Cada campanha tem um período de exibição e um valor total — o sistema calcula automaticamente o CPM (custo por mil impressões) com base no alcance do painel.",
      "O payback é calculado automaticamente: investimento total ÷ receita média mensal.",
    ],
    tip: "Mantenha os investimentos atualizados para que o cálculo de payback seja preciso.",
  },
  {
    id: "manutencao",
    title: "Controle de Manutenção",
    content: [
      "Na seção Manutenção você configura a frequência esperada de cada tipo de manutenção e registra as manutenções realizadas.",
      "O sistema calcula o custo médio mensal de manutenção para incluir no cálculo de payback.",
    ],
  },
  {
    id: "checklist",
    title: "Usando o Checklist",
    content: [
      "O Checklist reúne as tarefas recorrentes do painel.",
      "Cada tarefa pode ser Diária ou Semanal.",
      "Para marcar como concluída, clique na caixa ao lado da tarefa.",
      "Use as setas de data para ver o histórico de dias anteriores.",
    ],
    tip: "Faça o checklist todos os dias antes de sair.",
  },
  {
    id: "impacto",
    title: "Cálculo de Impacto",
    content: [
      "O impacto diário é calculado como: tráfego de carros/dia × fator médio de pessoas/carro para a localização do painel.",
      "Os fatores por localização são configurados em Configurações > Fatores de Impacto.",
      "O alcance mensal é o impacto diário × 30 dias.",
    ],
    tip: "Configure o fator de impacto para o estado e cidade do painel para ter cálculos precisos.",
  },
];
