/**
 * ============================================================
 * ARQUIVO: utils/styleClasses.ts
 * DESCRIÇÃO: Funções utilitárias para aplicar estilos visuais
 *            dinâmicos ao documento de atividade.
 *
 * O EduMaker suporta 4 temas visuais distintos, cada um com
 * um conjunto de classes Tailwind CSS diferente para:
 * - Card/container principal
 * - Linha divisória do cabeçalho
 * - Badge de série/ano
 * - Família tipográfica base
 * - Estilo do título
 * - Numeração das questões
 * - Box do texto base
 * ============================================================
 */

/** Conjunto de classes CSS para cada elemento estilizável */
export interface StyleClasses {
  card: string;
  headerDivider: string;
  badge: string;
  font: string;
  title: string;
  questionNumber: string;
  passageBox: string;
}

/**
 * Retorna o conjunto de classes Tailwind CSS correspondente
 * ao estilo visual selecionado pelo professor.
 *
 * @param style - Estilo visual da atividade ativa
 * @returns Objeto com classes CSS para cada elemento do documento
 *
 * @example
 * const classes = getStyleClasses("modern-professional");
 * // classes.card → "rounded-[16px] border border-neutral-100 bg-white p-8 shadow-xl"
 */
export function getStyleClasses(
  style: "modern-professional" | "ludic-childish" | "minimalist" | "classic-traditional"
): StyleClasses {
  switch (style) {

    // ── LÚDICO INFANTIL ────────────────────────────────────────────────
    // Bordas arredondadas, tracejadas e coloridas. Ideal para séries
    // iniciais do Ensino Fundamental (1º ao 5º ano).
    case "ludic-childish":
      return {
        card: "rounded-[24px] border-4 bg-[#FFFDF2] p-8",
        headerDivider: "border-b-4 border-dashed pb-4 mb-6",
        badge: "font-outfit rounded-full px-4 py-1 text-xs font-bold ring-2",
        font: "font-outfit",
        title: "text-2xl font-extrabold text-center uppercase tracking-wide",
        questionNumber: "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white",
        passageBox: "bg-[#FFF9E6] border-2 rounded-[16px] p-5 my-6 relative shadow-sm",
      };

    // ── MINIMALISTA ────────────────────────────────────────────────────
    // Sem arredondamentos, espaço generoso, monocromático.
    // Inspirado em Bauhaus e design editorial contemporâneo.
    case "minimalist":
      return {
        card: "rounded-none border-t-[6px] bg-white p-6 shadow-none",
        headerDivider: "border-b pb-3 mb-5",
        badge: "rounded-none px-3 py-0.5 text-[10px] font-mono tracking-widest uppercase text-white",
        font: "font-grotesk",
        title: "text-lg font-bold text-neutral-950 text-center uppercase tracking-wider",
        questionNumber: "w-6 h-6 rounded-none text-white flex items-center justify-center font-mono text-xs",
        passageBox: "pl-4 border-l my-4 py-1 italic text-neutral-700",
      };

    // ── CLÁSSICO TRADICIONAL ───────────────────────────────────────────
    // Serifa, bordas duplas e itálico. Estilo acadêmico formal,
    // próximo ao visual de universidades e provas ENEM/vestibular.
    case "classic-traditional":
      return {
        card: "rounded-[4px] border border-neutral-300 bg-white p-10 shadow-lg",
        headerDivider: "border-b-4 border-double pb-4 mb-6",
        badge: "bg-neutral-200 text-neutral-850 font-serif border px-3 py-1 text-xs italic",
        font: "font-serif",
        title: "text-2xl font-bold font-serif text-neutral-900 text-center italic tracking-normal border-b pb-2",
        questionNumber: "w-7 h-7 rounded-full border-2 flex items-center justify-center font-serif font-bold text-xs",
        passageBox: "bg-neutral-50 border p-6 my-6 italic text-[11.5pt] font-serif leading-relaxed text-neutral-800",
      };

    // ── MODERNO PROFISSIONAL (padrão) ──────────────────────────────────
    // Cantos arredondados suaves, sombras sutis e tipografia sans-serif.
    // Visual próximo ao Notion, Canva e ferramentas SaaS modernas.
    default: // "modern-professional"
      return {
        card: "rounded-[16px] border border-neutral-100 bg-white p-8 shadow-xl",
        headerDivider: "border-b-2 pb-4 mb-5",
        badge: "font-inter rounded-md px-2.5 py-0.5 text-xs font-semibold border uppercase tracking-tight",
        font: "font-inter",
        title: "text-xl font-extrabold text-neutral-800 text-center uppercase tracking-tight",
        questionNumber: "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs",
        passageBox: "bg-neutral-50/70 border-l-4 rounded-r-lg p-5 my-5 leading-relaxed text-neutral-700 font-inter",
      };
  }
}