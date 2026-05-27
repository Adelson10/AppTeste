/**
 * ============================================================
 * ARQUIVO: components/InlineEditors.tsx
 * DESCRIÇÃO: Componentes de edição inline no estilo Google Docs.
 *
 * Permitem que o professor clique em qualquer campo de texto
 * (título, enunciado, texto base) e edite diretamente na prévia,
 * sem abrir modais ou formulários separados.
 *
 * Técnica usada: estado local isolado para que cada tecla digitada
 * não re-renderize o documento inteiro — apenas o campo em edição.
 *
 * Atalhos de teclado:
 * - Enter  → salva a edição (apenas no InlineEditInput)
 * - Escape → cancela e descarta as alterações
 * ============================================================
 */

import React, { useState } from "react";

// ─────────────────────────────────────────────
// INLINE EDIT INPUT (Campo de texto simples)
// ─────────────────────────────────────────────

interface InlineEditInputProps {
  /** Valor inicial do campo (antes da edição começar) */
  value: string;
  /** Callback chamado quando o usuário confirma a edição */
  onSave: (val: string) => void;
  /** Callback chamado quando o usuário cancela com Escape */
  onCancel: () => void;
  /** Classes CSS adicionais para estilização */
  className?: string;
  /** Se verdadeiro, foca o campo automaticamente ao montar */
  autoFocus?: boolean;
}

/**
 * Campo de texto simples (input) para edição inline.
 *
 * Usado em:
 * - Nome da escola no cabeçalho
 * - Nome do professor
 * - Título da atividade
 * - Título do texto base
 */
export const InlineEditInput: React.FC<InlineEditInputProps> = ({
  value: initialValue,
  onSave,
  onCancel,
  className,
  autoFocus = true,
}) => {
  // Estado local isolado — não propaga re-render para o documento pai
  const [val, setVal] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Evita submit de formulário acidental
      onSave(val);
    } else if (e.key === "Escape") {
      onCancel(); // Descarta alterações e fecha o campo
    }
  };

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(val)} // Salva automaticamente ao perder o foco
      onKeyDown={handleKeyDown}
      className={className}
      autoFocus={autoFocus}
    />
  );
};

// ─────────────────────────────────────────────
// INLINE EDIT TEXTAREA (Campo de texto multilinha)
// ─────────────────────────────────────────────

interface InlineEditTextareaProps {
  /** Valor inicial do campo (antes da edição começar) */
  value: string;
  /** Callback chamado quando o usuário confirma a edição */
  onSave: (val: string) => void;
  /** Callback chamado quando o usuário cancela com Escape */
  onCancel: () => void;
  /** Classes CSS adicionais para estilização */
  className?: string;
  /** Número de linhas visíveis do textarea */
  rows?: number;
  /** Se verdadeiro, foca o campo automaticamente ao montar */
  autoFocus?: boolean;
}

/**
 * Campo de texto multilinha (textarea) para edição inline.
 *
 * Usado em:
 * - Corpo do texto base de leitura
 * - Enunciados de questões
 * - Anotações do gabarito do professor
 *
 * Nota: Não salva com Enter (para permitir quebras de linha).
 * O salvamento ocorre apenas ao perder o foco ou pressionar Escape.
 */
export const InlineEditTextarea: React.FC<InlineEditTextareaProps> = ({
  value: initialValue,
  onSave,
  onCancel,
  className,
  rows = 3,
  autoFocus = true,
}) => {
  // Estado local isolado para alta performance durante digitação
  const [val, setVal] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      onCancel(); // Cancela e fecha o textarea
    }
    // Nota intencional: Enter NÃO salva aqui (diferente do Input)
    // para permitir que o professor insira quebras de linha no texto
  };

  return (
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(val)} // Salva ao perder foco (clicar fora)
      onKeyDown={handleKeyDown}
      className={className}
      rows={rows}
      autoFocus={autoFocus}
    />
  );
};