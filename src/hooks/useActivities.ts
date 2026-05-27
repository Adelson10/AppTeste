/**
 * ============================================================
 * ARQUIVO: hooks/useActivities.ts
 * DESCRIÇÃO: Hook customizado para gerenciar o estado global
 *            das atividades pedagógicas.
 *
 * Responsabilidades:
 * - Carregar/salvar atividades no localStorage
 * - Criar, atualizar e excluir atividades
 * - Gerenciar a atividade ativa (aberta no editor)
 * - Operações sobre questões individuais
 * ============================================================
 */

import { useState, useEffect, useMemo } from "react";
import { Activity, Question, PageOptions } from "../types";
import { PRE_BAKED_ACTIVITIES, QUESTION_BANK_TEMPLATES } from "../data/prebaked";

// Chave usada para persistir os dados no localStorage do navegador
const STORAGE_KEY = "edumaker_activities";

/**
 * Hook principal de gerenciamento de atividades.
 *
 * @param searchQuery - Texto de busca para filtrar a lista de atividades
 * @returns Estado e funções para manipular atividades
 */
export function useActivities(searchQuery: string) {

  // ─────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────

  /**
   * Lista completa de atividades do professor.
   * Inicializa com dados do localStorage ou com as atividades pré-prontas.
   */
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : PRE_BAKED_ACTIVITIES;
  });

  /**
   * Atividade atualmente aberta no editor central.
   * Inicializa com a primeira atividade da lista.
   */
  const [activeDoc, setActiveDoc] = useState<Activity>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const list: Activity[] = saved ? JSON.parse(saved) : PRE_BAKED_ACTIVITIES;
    return list.length > 0 ? list[0] : PRE_BAKED_ACTIVITIES[0];
  });

  // ─────────────────────────────────────────────
  // PERSISTÊNCIA AUTOMÁTICA
  // ─────────────────────────────────────────────

  /**
   * Sempre que a lista de atividades muda, salva automaticamente no localStorage.
   * Isso garante que o portfólio do professor não seja perdido ao fechar o navegador.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  // ─────────────────────────────────────────────
  // FILTRO DE BUSCA (memorizado para performance)
  // ─────────────────────────────────────────────

  /**
   * Lista filtrada de atividades baseada no texto de busca.
   * Usa useMemo para evitar recalcular a cada renderização desnecessária.
   *
   * A busca é feita por:
   * - Título da atividade
   * - Disciplina/matéria
   */
  const filteredActivities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activities;
    return activities.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.config.subject.toLowerCase().includes(q)
    );
  }, [activities, searchQuery]);

  // ─────────────────────────────────────────────
  // FUNÇÕES DE MANIPULAÇÃO DE ATIVIDADES
  // ─────────────────────────────────────────────

  /**
   * Adiciona uma nova atividade ao topo da lista e a define como ativa.
   * Chamada após geração por IA ou fallback local.
   */
  const addActivity = (newActivity: Activity) => {
    setActivities(prev => [newActivity, ...prev]);
    setActiveDoc(newActivity);
  };

  /**
   * Sincroniza uma versão modificada da atividade ativa tanto no
   * estado local (activeDoc) quanto na lista global (activities).
   *
   * @param updated - Objeto da atividade com as alterações aplicadas
   */
  const updateActiveDoc = (updated: Activity) => {
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  /**
   * Remove uma atividade da lista pelo ID.
   * Se a atividade removida era a ativa, nenhuma substituição automática é feita
   * (o componente pai deve tratar isso se necessário).
   */
  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  // ─────────────────────────────────────────────
  // FUNÇÕES DE EDIÇÃO DA ATIVIDADE ATIVA
  // ─────────────────────────────────────────────

  /**
   * Altera a cor primária do tema visual da atividade ativa.
   */
  const updateDocColor = (hex: string) => {
    updateActiveDoc({ ...activeDoc, visual: { ...activeDoc.visual, color: hex } });
  };

  /**
   * Altera a fonte tipográfica da atividade ativa.
   */
  const updateDocFont = (font: string) => {
    updateActiveDoc({ ...activeDoc, visual: { ...activeDoc.visual, fontFamily: font } });
  };

  /**
   * Altera o estilo visual (tema de layout) da atividade ativa.
   */
  const updateDocStyle = (style: "modern-professional" | "ludic-childish" | "minimalist" | "classic-traditional") => {
    updateActiveDoc({ ...activeDoc, visual: { ...activeDoc.visual, style } });
  };

  /**
   * Alterna (liga/desliga) uma opção de página da atividade ativa.
   * Ex: ocultar gabarito, mostrar linhas, etc.
   */
  const togglePageOption = (key: keyof PageOptions) => {
    updateActiveDoc({
      ...activeDoc,
      pages: { ...activeDoc.pages, [key]: !activeDoc.pages[key] }
    });
  };

  // ─────────────────────────────────────────────
  // FUNÇÕES DE QUESTÕES
  // ─────────────────────────────────────────────

  /**
   * Adiciona uma nova questão ao final da atividade ativa,
   * baseada em um template do banco de questões.
   *
   * @param qTemplate - Template de questão do QUESTION_BANK_TEMPLATES
   */
  const appendQuestion = (qTemplate: typeof QUESTION_BANK_TEMPLATES[0]) => {
    // Gera um ID sequencial a partir do maior ID existente
    const newId = activeDoc.questions.length > 0
      ? Math.max(...activeDoc.questions.map(q => q.id)) + 1
      : 1;

    const newQ: Question = {
      id: newId,
      type: qTemplate.type as "multiple-choice" | "essay",
      prompt: qTemplate.prompt,
      options: qTemplate.options.length > 0 ? [...qTemplate.options] : undefined,
      correctAnswer: qTemplate.correctAnswer,
      explanation: qTemplate.explanation,
    };

    updateActiveDoc({
      ...activeDoc,
      questions: [...activeDoc.questions, newQ],
    });
  };

  /**
   * Remove uma questão da atividade ativa pelo seu ID.
   */
  const deleteQuestion = (qId: number) => {
    updateActiveDoc({
      ...activeDoc,
      questions: activeDoc.questions.filter(q => q.id !== qId),
    });
  };

  /**
   * Adiciona ou troca a imagem ilustrativa de um texto base ou questão.
   *
   * @param type        - "passage" para o texto base, "question" para uma questão
   * @param imageUrl    - URL da imagem a ser inserida
   * @param imagePrompt - Legenda/descrição da imagem
   * @param questionId  - ID da questão (obrigatório quando type === "question")
   */
  const updateImage = (
    type: "passage" | "question",
    imageUrl: string,
    imagePrompt?: string,
    questionId?: number
  ) => {
    let updated = { ...activeDoc };

    if (type === "passage" && updated.readingPassage) {
      updated.readingPassage = { ...updated.readingPassage, imageUrl, imagePrompt };
    } else if (type === "question" && questionId !== undefined) {
      updated.questions = updated.questions.map(q =>
        q.id === questionId ? { ...q, imageUrl, imagePrompt } : q
      );
    }

    updateActiveDoc(updated);
  };

  /**
   * Remove a imagem ilustrativa de um texto base ou questão.
   *
   * @param type       - "passage" para o texto base, "question" para uma questão
   * @param questionId - ID da questão (obrigatório quando type === "question")
   */
  const removeImage = (type: "passage" | "question", questionId?: number) => {
    let updated = { ...activeDoc };

    if (type === "passage" && updated.readingPassage) {
      // Desestrutura para remover os campos de imagem
      const { imageUrl, imagePrompt, ...rest } = updated.readingPassage;
      updated.readingPassage = rest;
    } else if (type === "question" && questionId !== undefined) {
      updated.questions = updated.questions.map(q => {
        if (q.id === questionId) {
          const { imageUrl, imagePrompt, ...rest } = q;
          return rest;
        }
        return q;
      });
    }

    updateActiveDoc(updated);
  };

  // Retorna todo o estado e funções para uso nos componentes
  return {
    // Estado
    activities,
    activeDoc,
    filteredActivities,

    // Ações de atividade
    setActiveDoc,
    addActivity,
    updateActiveDoc,
    deleteActivity,

    // Ações visuais
    updateDocColor,
    updateDocFont,
    updateDocStyle,
    togglePageOption,

    // Ações de questões
    appendQuestion,
    deleteQuestion,
    updateImage,
    removeImage,
  };
}