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
      "Este aplicativo é a central de controle do painel de LED da empresa. Aqui você organiza o conteúdo que está sendo exibido, verifica as tarefas do dia e acompanha o histórico de uso.",
      "O aplicativo tem 4 seções principais: Conteúdo, Checklist, Métricas e Tutorial (esta página).",
    ],
  },
  {
    id: "conteudo",
    title: "Gestão de Conteúdo",
    content: [
      "Na seção Conteúdo você cadastra tudo que pode ser exibido no painel: textos, imagens e vídeos.",
      "Cada item tem um status: Rascunho (em preparação), Agendado (com data definida para entrar), Ativo (sendo exibido agora) e Arquivado (não exibido mais).",
      "Para adicionar um novo conteúdo, clique em '+ Novo conteúdo', preencha o título, escolha o tipo e defina o status.",
      "Se o conteúdo for do tipo Imagem ou Vídeo, informe o nome do arquivo exatamente como ele está salvo no computador ou no painel.",
    ],
    tip: "Mantenha apenas 1 item com status 'Ativo' por vez para evitar confusão sobre o que está sendo exibido.",
  },
  {
    id: "ligar-painel",
    title: "Como ligar e desligar o painel",
    content: [
      "Para ligar o painel, pressione o botão de energia localizado na parte traseira do equipamento.",
      "Aguarde aproximadamente 30 segundos para o sistema inicializar completamente.",
      "Para desligar, pressione o mesmo botão novamente e aguarde o painel apagar completamente antes de desligar a tomada.",
    ],
    tip: "Nunca desligue a tomada sem antes pressionar o botão de energia — isso pode corromper os arquivos do painel.",
  },
  {
    id: "atualizar-conteudo",
    title: "Como atualizar o conteúdo no painel físico",
    content: [
      "Conecte o pendrive ou cabo USB ao painel conforme instruído pelo fornecedor.",
      "Copie os arquivos de mídia para a pasta correta no dispositivo do painel.",
      "Reinicie o painel para que o novo conteúdo seja carregado automaticamente.",
      "Após confirmar que o novo conteúdo está sendo exibido, atualize o status no aplicativo.",
    ],
    tip: "Use formatos de arquivo compatíveis com o painel: MP4 para vídeos, JPG ou PNG para imagens.",
  },
  {
    id: "checklist",
    title: "Usando o Checklist",
    content: [
      "O Checklist reúne as tarefas que precisam ser feitas regularmente para manter o painel funcionando corretamente.",
      "Cada tarefa pode ser Diária (aparece todo dia) ou Semanal (aparece em um dia específico da semana).",
      "Para marcar uma tarefa como concluída, clique na caixa ao lado dela. Clique novamente para desmarcar.",
      "Você pode navegar por dias anteriores usando as setas ao lado da data para ver o histórico.",
      "Para adicionar uma nova tarefa, clique em '+ Adicionar tarefa' e preencha as informações.",
    ],
    tip: "Faça o checklist todos os dias antes de sair, assim você garante que nada foi esquecido.",
  },
  {
    id: "metricas",
    title: "Entendendo as Métricas",
    content: [
      "A seção Métricas mostra um resumo do uso do painel nos últimos 7 ou 30 dias.",
      "'Publicados' mostra quantos conteúdos foram ativados no período.",
      "'Ativos agora' mostra quantos conteúdos estão com status Ativo no momento.",
      "'Checklist %' mostra a taxa de conclusão média das tarefas do período.",
      "'Dias 100%' mostra quantos dias o checklist foi completado totalmente.",
      "Os gráficos mostram a distribuição de conteúdo por tipo e a evolução das publicações e do checklist dia a dia.",
    ],
  },
];
