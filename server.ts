import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse json requests
  app.use(express.json());

  // Initialize Gemini Client Lazily/Safely
  let ai: GoogleGenAI | null = null;
  const getGeminiClient = () => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("A variável de ambiente GEMINI_API_KEY não foi configurada. Configure-a no menu de Segredos para gerar atividades pelo modelo de IA.");
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return ai;
  };

  // API Route to request Educational Activities using Gemini
  app.post("/api/generate-activity", async (req, res) => {
    try {
      const { config } = req.body;
      if (!config) {
        return res.status(400).json({ error: "Configurações da atividade ausentes." });
      }

      const client = getGeminiClient();

      const { subject, grade, theme, bncc, numQuestions, questionTypes } = config;
      
      // Build selected types string to tell the model what to focus on
      const selectedTypes: string[] = [];
      if (questionTypes.multipleChoice) selectedTypes.push("Múltipla Escolha (4 opções: A, B, C, D)");
      if (questionTypes.trueFalse) selectedTypes.push("Verdadeiro ou Falso (V ou F)");
      if (questionTypes.essay) selectedTypes.push("Dissertativa (questão discursiva com linhas para resposta)");

      if (selectedTypes.length === 0) {
        // Fallback to multiple choice if none selected
        selectedTypes.push("Múltipla Escolha (4 opções: A, B, C, D)");
      }

      const includePassage = questionTypes.passage;

      const prompt = `Gere uma atividade pedagógica de alta qualidade em português (Brasil) estruturada para:
- Disciplina: ${subject}
- Ano/Série: ${grade}
- Tema Principal: ${theme}
- Códigos BNCC relacionados: ${bncc || "Alinhados aos temas curriculares nacionais equivalentes"}
- Número total de questões: ${numQuestions || 5}
- Tipos de questões permitidas: ${selectedTypes.join(", ")}
- Deve incluir um texto base de leitura e interpretação? ${includePassage ? "SIM" : "NÃO"}.

Instruções pedagógicas:
1. O nível cognitivo, vocabulário e complexidade do texto e das perguntas devem ser estritamente compatíveis com alunos do ${grade}.
2. Se marcado SIM para texto base, gere um texto autoral de leitura que contextualize as perguntas, com título interessante e conteúdo em 2 ou 3 parágrafos fluídos. Atribua uma fonte adequada.
3. Se marcado NÃO para texto base, as questões devem ser diretas e contextualizadas individualmente.
4. As perguntas do tipo Múltipla Escolha devem ter exatamente 4 opções claras de resposta. Não inclua as letras "A)", "B)", "C)" na resposta no JSON, apenas a frase direta de cada opção.
5. As perguntas do tipo Verdadeiro ou Falso devem listar frases claras com gabarito "V" ou "F".
6. O campo 'correctAnswer' para Múltipla Escolha deve conter a letra correspondente ('A', 'B', 'C' ou 'D'). Para verdadeiro ou falso, deve conter 'V' ou 'F'. Para dissertativa, forneça critérios de resposta esperada ou uma resposta modelo pedagógica.
7. Escreva justificativas pedagógicas ricas em 'explanation' para ajudar o professor a dar feedback personalizado.`;

      const systemInstruction = 
        "Você é um pedagogo experiente especialista em elaboração de avaliações alinhadas com as diretrizes da Base Nacional Comum Curricular (BNCC). Seu objetivo é gerar atividades prontas para professores utilizarem em sala de aula de forma instantânea. Sempre devolva códigos válidos de JSON estrito seguindo o esquema fornecido.";

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título principal da atividade (Ex: Atividade de Língua Portuguesa - 8º Ano)" },
              readingPassage: {
                type: Type.OBJECT,
                description: "Texto pedagógico de leitura estruturado em parágrafos normais. Opcional.",
                properties: {
                  title: { type: Type.STRING, description: "Título do texto base" },
                  text: { type: Type.STRING, description: "Conteúdo completo com quebras de linha normais entre parágrafos" },
                  source: { type: Type.STRING, description: "Indicação da autoria ou fonte fictícia/real" }
                },
                required: ["title", "text"]
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    type: { type: Type.STRING, description: "Deve ser um dos: 'multiple-choice', 'true-false' ou 'essay'" },
                    prompt: { type: Type.STRING, description: "Enunciado claro e contextualizado da questão" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Lista de frases das alternativas. Forneça 4 alternativas para multiple-choice e use [] para dissertativas."
                    },
                    correctAnswer: { type: Type.STRING, description: "Gabarito: Letra correspondente ou Resposta modelo." },
                    explanation: { type: Type.STRING, description: "Foco didático: Explicação do porquê a resposta é correta ou critério de correção." }
                  },
                  required: ["id", "type", "prompt", "correctAnswer", "explanation"]
                }
              },
              gabaritoNotes: { type: Type.STRING, description: "Anotações adicionais de ensino para o professor aplicador." }
            },
            required: ["title", "questions"]
          }
        }
      });

      if (!response.text) {
        throw new Error("O modelo não retornou nenhuma resposta textual.");
      }

      const activityData = JSON.parse(response.text.trim());
      res.json(activityData);
    } catch (error: any) {
      console.error("Erro ao gerar atividade:", error);
      res.status(500).json({ error: error?.message || "Erro desconhecido ao gerar atividade com IA." });
    }
  });

  // Health and validation route
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", keyConfigured: !!process.env.GEMINI_API_KEY });
  });

  // Vite development middleware setups
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EduMaker] Servidor rodando em http//0.0.0.0:${PORT}`);
  });
}

startServer();
