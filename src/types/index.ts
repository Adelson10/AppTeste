/**
 * ============================================================
 * ARQUIVO: types/index.ts
 * DESCRIÇÃO: Definição de todos os tipos e interfaces TypeScript
 *            usados em todo o projeto EduMaker.
 *
 * Este arquivo centraliza as estruturas de dados da aplicação,
 * garantindo consistência e segurança de tipos em todos os módulos.
 * ============================================================
 */

// ─────────────────────────────────────────────
// PERFIL DA ESCOLA
// ─────────────────────────────────────────────

/**
 * Representa o perfil da unidade escolar ativa.
 * Usado no cabeçalho das atividades e nas configurações.
 */
export interface SchoolProfile {
  /** Nome completo da instituição de ensino */
  name: string;
  /** Segmento de atuação (ex: "Ensino Fundamental II") */
  segment: string;
  /** Tipo de ícone/brasão exibido no cabeçalho da atividade */
  logoType: "shield" | "book" | "star" | "circle";
}

// ─────────────────────────────────────────────
// PERFIL DO PROFESSOR
// ─────────────────────────────────────────────

/**
 * Representa o professor/usuário logado no sistema.
 */
export interface TeacherProfile {
  /** Nome do docente (aparece nas atividades geradas) */
  name: string;
  /** Cargo ou função pedagógica */
  role: string;
  /** Quantidade de créditos premium disponíveis para geração por IA */
  credits: number;
  /** Total de atividades salvas no portfólio */
  savedCount: number;
}

// ─────────────────────────────────────────────
// CONFIGURAÇÃO DA ATIVIDADE (PARÂMETROS DE GERAÇÃO)
// ─────────────────────────────────────────────

/**
 * Parâmetros pedagógicos usados para configurar a geração
 * de uma nova atividade (via IA ou banco de questões).
 */
export interface ActivityConfig {
  /** Disciplina/matéria (ex: "Língua Portuguesa", "Matemática") */
  subject: string;
  /** Série/ano escolar (ex: "8º Ano do Ensino Fundamental") */
  grade: string;
  /** Tema principal da atividade (ex: "Interpretação de Texto") */
  theme: string;
  /** Códigos BNCC relacionados ao conteúdo (ex: "EF69LP44") */
  bncc: string;
  /** Quantidade de questões a serem geradas */
  numQuestions: number;
  /** Tipos de questões desejados na atividade */
  questionTypes: {
    multipleChoice: boolean; // Múltipla escolha
    trueFalse: boolean;      // Verdadeiro ou Falso
    essay: boolean;          // Dissertativa/Discursiva
    passage: boolean;        // Incluir texto base de leitura
  };
}

// ─────────────────────────────────────────────
// CONFIGURAÇÃO VISUAL
// ─────────────────────────────────────────────

/**
 * Configurações de aparência visual da atividade impressa.
 * Controla o tema, cor e tipografia do documento gerado.
 */
export interface VisualConfig {
  /**
   * Estilo visual do layout:
   * - modern-professional: Clean, Notion/Canva style
   * - ludic-childish: Colorido, arredondado, para séries iniciais
   * - minimalist: Monocromático e espaçado
   * - classic-traditional: Serifa, estilo acadêmico formal
   */
  style: "modern-professional" | "ludic-childish" | "minimalist" | "classic-traditional";
  /** Cor primária em hexadecimal (ex: "#3B82F6") */
  color: string;
  /** Família tipográfica (ex: "Inter", "Playfair Display") */
  fontFamily: string;
}

// ─────────────────────────────────────────────
// OPÇÕES DE PÁGINA
// ─────────────────────────────────────────────

/**
 * Toggles que controlam quais seções são exibidas
 * na pré-visualização e impressão da atividade.
 */
export interface PageOptions {
  /** Exibe o cabeçalho com nome da escola e campos do aluno */
  schoolHeader: boolean;
  /** Exibe o rodapé com paginação */
  footerPage: boolean;
  /** Exibe o gabarito oficial ao final do documento */
  gabarito: boolean;
  /** Reserva espaço extra entre questões para respostas */
  spaceForAnswers: boolean;
  /** Insere linhas pautadas nas questões dissertativas */
  linesForEssay: boolean;
}

// ─────────────────────────────────────────────
// TEXTO BASE (PASSAGEM DE LEITURA)
// ─────────────────────────────────────────────

/**
 * Texto de apoio exibido antes das questões.
 * Comum em atividades de interpretação de texto.
 */
export interface ReadingPassage {
  /** Título do texto ou obra */
  title: string;
  /** Corpo completo do texto de leitura */
  text: string;
  /** Citação da fonte ou autor (opcional) */
  source?: string;
  /** URL de imagem ilustrativa do texto (opcional) */
  imageUrl?: string;
  /** Descrição/legenda da imagem (opcional) */
  imagePrompt?: string;
}

// ─────────────────────────────────────────────
// QUESTÃO
// ─────────────────────────────────────────────

/**
 * Representa uma questão individual da atividade.
 * Suporta múltiplos tipos com estruturas diferentes.
 */
export interface Question {
  /** Identificador único da questão dentro da atividade */
  id: number;
  /**
   * Tipo da questão:
   * - multiple-choice: Alternativas A/B/C/D
   * - true-false: Afirmativas V ou F
   * - essay: Resposta dissertativa aberta
   */
  type: "multiple-choice" | "true-false" | "essay";
  /** Enunciado/texto da pergunta */
  prompt: string;
  /** Lista de alternativas (para múltipla escolha e V/F) */
  options?: string[];
  /** Gabarito: letra correta (ex: "B") ou texto da resposta */
  correctAnswer: string;
  /** Justificativa pedagógica para uso do professor */
  explanation: string;
  /** URL de imagem de apoio à questão (opcional) */
  imageUrl?: string;
  /** Descrição da imagem da questão (opcional) */
  imagePrompt?: string;
}

// ─────────────────────────────────────────────
// ATIVIDADE (DOCUMENTO PRINCIPAL)
// ─────────────────────────────────────────────

/**
 * Representa uma atividade completa salva no portfólio do professor.
 * É a entidade central do sistema — tudo gira em torno dela.
 */
export interface Activity {
  /** ID único gerado no momento da criação (ex: "act-1716000000000") */
  id: string;
  /** Título principal exibido no topo da atividade */
  title: string;
  /** Nome da escola no momento da criação */
  schoolName: string;
  /** Nome do professor no momento da criação */
  teacherName: string;
  /** Data/hora de criação em formato ISO 8601 */
  createdAt: string;
  /** Parâmetros pedagógicos usados na geração */
  config: ActivityConfig;
  /** Configurações visuais do documento */
  visual: VisualConfig;
  /** Opções de exibição de seções da página */
  pages: PageOptions;
  /** Texto base de leitura (opcional — quando passage=true) */
  readingPassage?: ReadingPassage;
  /** Lista de questões da atividade */
  questions: Question[];
  /** Anotações livres do professor no gabarito */
  gabaritoNotes?: string;
}