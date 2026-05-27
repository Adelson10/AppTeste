/**
 * ============================================================
 * ARQUIVO: hooks/useActivityGenerator.ts
 * DESCRIÇÃO: Hook customizado responsável pela geração de
 *            atividades pedagógicas via IA ou fallback local.
 *
 * Fluxo principal:
 * 1. Tenta chamar a API de IA na rota /api/generate-activity
 * 2. Em caso de falha, usa o "motor local" com atividades pré-prontas
 * 3. Consome 20 créditos do professor por geração
 * ============================================================
 */

import { useState } from "react";
import { Activity, ActivityConfig, SchoolProfile, TeacherProfile } from "../types";
import { PRE_BAKED_ACTIVITIES } from "../data/prebaked";

/**
 * Hook para geração de atividades.
 *
 * @param onActivityGenerated - Callback chamado com a nova atividade gerada
 * @param onCreditConsumed    - Callback para deduzir créditos do professor
 */
export function useActivityGenerator(
  onActivityGenerated: (activity: Activity) => void,
  onCreditConsumed: () => void
) {
  // Estado de carregamento (enquanto a IA processa)
  const [loading, setLoading] = useState(false);
  // Mensagem de erro exibida quando a IA falha (e o fallback é ativado)
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  /**
   * Gera uma atividade completa usando a API de IA.
   *
   * Se a API falhar (rede, timeout, erro de servidor), ativa automaticamente
   * o motor local de fallback, selecionando uma atividade pré-pronta adaptada.
   *
   * @param genConfig     - Parâmetros pedagógicos configurados pelo professor
   * @param schoolProfile - Perfil da escola ativa
   * @param teacherProfile - Perfil do professor logado
   */
  const generateActivity = async (
    genConfig: ActivityConfig,
    schoolProfile: SchoolProfile,
    teacherProfile: TeacherProfile
  ) => {
    setLoading(true);
    setErrorInfo(null);

    try {
      // ── CHAMADA À API DE IA ──────────────────────────────────────────
      const response = await fetch("/api/generate-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: genConfig }),
      });

      if (!response.ok) {
        throw new Error(
          "Não foi possível gerar a atividade automaticamente. " +
          "Por favor, tente novamente ou ajuste os critérios."
        );
      }

      const data = await response.json();

      // Monta o objeto de atividade com os dados retornados pela IA
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        title: data.title || `Atividade de ${genConfig.subject}`,
        schoolName: schoolProfile.name,
        teacherName: teacherProfile.name,
        createdAt: new Date().toISOString(),
        config: { ...genConfig },
        visual: {
          style: "modern-professional",
          color: "#3B82F6",
          fontFamily: "Inter",
        },
        pages: {
          schoolHeader: true,
          footerPage: true,
          gabarito: true,
          spaceForAnswers: true,
          linesForEssay: true,
        },
        // O texto base é opcional — só inclui se a IA retornou um
        readingPassage: data.readingPassage
          ? {
              title: data.readingPassage.title,
              text: data.readingPassage.text,
              source: data.readingPassage.source || "EduMaker IA",
            }
          : undefined,
        questions: data.questions || [],
        gabaritoNotes: data.gabaritoNotes || "",
      };

      onActivityGenerated(newActivity);
      onCreditConsumed();

    } catch (err: any) {
      // ── FALLBACK LOCAL ───────────────────────────────────────────────
      // Quando a IA não está disponível, usa o banco local de atividades
      // pré-prontas como substituto inteligente, mantendo o fluxo funcionando.
      console.warn("Gerando via IA falhou, ativando motor de fallback local.", err);
      setErrorInfo(
        err?.message ||
        "Erro de conectividade. Usando o mecanismo local de compilação instantânea."
      );

      // Seleciona o template mais adequado com base na disciplina escolhida
      const sampleSubject = genConfig.subject.toLowerCase();
      let selectedSample = PRE_BAKED_ACTIVITIES[0]; // padrão: Língua Portuguesa

      if (sampleSubject.includes("mat") || sampleSubject.includes("núm")) {
        selectedSample = PRE_BAKED_ACTIVITIES[1]; // usa template de Matemática
      }

      const fallbackActivity: Activity = {
        id: `act-gen-${Date.now()}`,
        title: `Atividade de ${genConfig.subject} (${genConfig.theme})`,
        schoolName: schoolProfile.name,
        teacherName: teacherProfile.name,
        createdAt: new Date().toISOString(),
        config: { ...genConfig },
        visual: {
          style: "modern-professional",
          color: "#4F46E5", // Índigo para diferenciar do gerado por IA
          fontFamily: "Inter",
        },
        pages: {
          schoolHeader: true,
          footerPage: true,
          gabarito: true,
          spaceForAnswers: true,
          linesForEssay: true,
        },
        // Só inclui texto base se o professor habilitou a opção "Incluir Texto Base"
        readingPassage: genConfig.questionTypes.passage
          ? selectedSample.readingPassage
          : undefined,
        // Reutiliza as questões do template, renumerando os IDs sequencialmente
        questions: [...selectedSample.questions].map((q, idx) => ({ ...q, id: idx + 1 })),
        gabaritoNotes:
          "Atividade compilada pelo motor inteligente nativo do EduMaker.",
      };

      onActivityGenerated(fallbackActivity);
      onCreditConsumed();

    } finally {
      // Sempre encerra o loading, independente de sucesso ou falha
      setLoading(false);
    }
  };

  return {
    loading,
    errorInfo,
    generateActivity,
  };
}