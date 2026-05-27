/**
 * ============================================================
 * ARQUIVO: utils/exportWord.ts
 * DESCRIÇÃO: Função para exportar a atividade como arquivo Word (.doc).
 *
 * Como funciona:
 * 1. Monta um HTML completo com o conteúdo da atividade
 * 2. Usa o namespace XML do Microsoft Word (MIME "application/msword")
 * 3. Cria um Blob com o HTML e gera um link temporário de download
 * 4. O Word consegue abrir arquivos .doc baseados em HTML puro
 *
 * Limitações:
 * - Não é um .docx real (usa HTML + MIME type do Word como workaround)
 * - Formatações complexas podem não ser 100% preservadas no Word
 * - Imagens de URL externa podem não aparecer offline
 * ============================================================
 */

import { Activity, SchoolProfile } from "../types";

/**
 * Exporta a atividade ativa para download como arquivo Word (.doc).
 *
 * @param activeDoc    - Atividade a ser exportada
 * @param schoolProfile - Perfil da escola (para segmento no cabeçalho)
 */
export function exportToWord(activeDoc: Activity, schoolProfile: SchoolProfile): void {
  const title = activeDoc.title || "Atividade Escolar";

  // ── BLOCO: Cabeçalho da escola ──────────────────────────────────────
  // Exibido apenas se a opção "Cabeçalho Escolar" estiver ativa nas páginas
  const headerHtml = activeDoc.pages.schoolHeader
    ? `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 3px double #333;">
      <tr>
        <td style="width: 60%; vertical-align: top;">
          <div style="font-size: 16pt; font-weight: bold; font-family: Arial;">
            ${activeDoc.schoolName || "COLÉGIO EXEMPLO"}
          </div>
          <div style="font-size: 10pt; color: #555;">${schoolProfile.segment || ""}</div>
        </td>
        <td style="width: 40%; vertical-align: top;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10pt; font-family: Arial;">
            <tr><td><b>Aluno:</b> ____________________________</td></tr>
            <tr><td><b>Turma:</b> ________ <b>Data:</b> ___/___/_____</td></tr>
            <tr><td><b>Professor:</b> ${activeDoc.teacherName || ""}</td></tr>
          </table>
        </td>
      </tr>
    </table>`
    : "";

  // ── BLOCO: Texto base de leitura ─────────────────────────────────────
  // Exibido apenas se a atividade tiver um readingPassage definido
  const passageHtml = activeDoc.readingPassage
    ? `
    <div style="border-left: 4px solid ${activeDoc.visual.color}; padding: 10px; margin-bottom: 20px; font-family: Georgia;">
      <div style="font-weight: bold; font-size: 12pt; margin-bottom: 5px;">
        ${activeDoc.readingPassage.title}
      </div>
      <div style="font-size: 11pt; line-height: 1.6;">
        ${activeDoc.readingPassage.text}
      </div>
    </div>`
    : "";

  // ── BLOCO: Questões ──────────────────────────────────────────────────
  // Renderiza cada questão de acordo com seu tipo
  const questionsHtml = activeDoc.questions
    .map((q, idx) => {
      let options = "";

      if (q.type === "multiple-choice") {
        // Alternativas com letras A), B), C)...
        options = (q.options || [])
          .map(
            (opt, i) => `
          <div style="margin-left: 20px;">
            <b>${String.fromCharCode(65 + i)})</b> ${opt}
          </div>`
          )
          .join("");
      }

      if (q.type === "true-false") {
        // Opções com parênteses para marcar V ou F
        options = (q.options || [])
          .map(
            (opt) => `
          <div style="margin-left: 20px;">( ) ${opt}</div>`
          )
          .join("");
      }

      if (q.type === "essay") {
        // Linhas para resposta dissertativa
        options = `
          <div style="margin-top: 10px;">
            _______________________________<br/>
            _______________________________<br/>
            _______________________________
          </div>`;
      }

      return `
        <div style="margin-bottom: 18px; font-family: Arial; font-size: 11pt;">
          <div><b>${idx + 1})</b> ${q.prompt}</div>
          ${options}
        </div>`;
    })
    .join("");

  // ── BLOCO: Gabarito oficial ──────────────────────────────────────────
  // Impresso em página separada (page-break), apenas se a opção estiver ativa
  const gabaritoHtml = activeDoc.pages.gabarito
    ? `
    <div style="page-break-before: always; margin-top: 30px;">
      <div style="font-size: 14pt; font-weight: bold; color: red; margin-bottom: 15px;">
        GABARITO
      </div>
      ${activeDoc.questions
        .map(
          (q, idx) => `
        <div style="margin-bottom: 12px;">
          <b>${idx + 1}:</b> ${q.correctAnswer}
        </div>`
        )
        .join("")}
    </div>`
    : "";

  // ── DOCUMENTO HTML COMPLETO ──────────────────────────────────────────
  // O Word aceita HTML com namespace XML como formato .doc legado
  const htmlContent = `
    <html
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
    >
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial; font-size: 12pt; }
        </style>
      </head>
      <body style="padding: 40px;">
        ${headerHtml}
        <div style="text-align:center; font-size:16pt; font-weight:bold; margin-bottom:20px;">
          ${title}
        </div>
        ${passageHtml}
        ${questionsHtml}
        ${gabaritoHtml}
      </body>
    </html>`;

  // ── GERAÇÃO DO DOWNLOAD ──────────────────────────────────────────────
  // \ufeff = BOM (Byte Order Mark) necessário para encoding UTF-8 correto no Word
  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Nome do arquivo: título sanitizado (só alfanuméricos e underscores)
  a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.doc`;

  document.body.appendChild(a);
  a.click();           // Dispara o download
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Libera memória do Blob
}