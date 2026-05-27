# EduMaker — Documentação Técnica

> Plataforma SaaS educacional para professores criarem atividades pedagógicas
> alinhadas à BNCC com auxílio de inteligência artificial.

---

## O que é o EduMaker?

O EduMaker é uma aplicação web React que permite professores do Ensino Fundamental:

1. **Gerar atividades completas** com IA (questões, texto base, gabarito)
2. **Editar diretamente** na prévia visual, no estilo Google Docs
3. **Personalizar o visual** com temas, cores e fontes
4. **Exportar** em Word (.doc) ou imprimir como PDF
5. **Gerenciar um portfólio** de atividades salvas localmente

---

## Estrutura de Arquivos (após divisão)

```
edumaker/
│
├── types/
│   └── index.ts               # Todos os tipos TypeScript da aplicação
│
├── hooks/
│   ├── useActivities.ts       # Estado e operações das atividades
│   └── useActivityGenerator.ts # Geração por IA + fallback local
│
├── components/
│   └── InlineEditors.tsx      # Campos de edição inline (estilo Docs)
│
├── utils/
│   ├── exportWord.ts          # Exportação para arquivo .doc
│   └── styleClasses.ts        # Classes CSS dos 4 temas visuais
│
└── App.tsx                    # Componente raiz (orquestra tudo)
```

---

## Arquitetura e Fluxo de Dados

```
App.tsx
  │
  ├─── useActivities(searchQuery)
  │       ├── Estado: activities[], activeDoc
  │       ├── Persistência: localStorage
  │       └── Operações: CRUD de atividades e questões
  │
  ├─── useActivityGenerator(onGenerated, onCreditConsumed)
  │       ├── Chama: POST /api/generate-activity
  │       └── Fallback: PRE_BAKED_ACTIVITIES local
  │
  ├─── getStyleClasses(activeDoc.visual.style)
  │       └── Retorna classes Tailwind por tema
  │
  ├─── exportToWord(activeDoc, schoolProfile)
  │       └── Gera download de arquivo .doc
  │
  └─── <InlineEditInput /> / <InlineEditTextarea />
          └── Edição direta nos campos do documento
```

---

## Módulos Explicados

### `types/index.ts`
Define todas as interfaces TypeScript. Entidades principais:

| Interface | O que representa |
|---|---|
| `Activity` | Uma atividade completa (documento principal) |
| `Question` | Uma questão individual (MC, V/F, dissertativa) |
| `ReadingPassage` | Texto base de leitura antes das questões |
| `ActivityConfig` | Parâmetros de geração (matéria, série, tema, BNCC) |
| `VisualConfig` | Configurações de tema, cor e fonte |
| `PageOptions` | Toggles de seções da página (cabeçalho, gabarito etc.) |
| `SchoolProfile` | Dados da escola ativa |
| `TeacherProfile` | Dados do professor logado |

---

### `hooks/useActivities.ts`
Gerencia todo o estado das atividades.

**Estado interno:**
- `activities[]` — lista completa do portfólio
- `activeDoc` — atividade aberta no editor

**Funções expostas:**
```ts
addActivity(activity)        // Adiciona e abre nova atividade
updateActiveDoc(updated)     // Atualiza atividade ativa (doc + lista)
deleteActivity(id)           // Remove da lista por ID
updateDocColor(hex)          // Muda cor do tema
updateDocFont(font)          // Muda fonte tipográfica
updateDocStyle(style)        // Muda tema visual
togglePageOption(key)        // Liga/desliga seção da página
appendQuestion(template)     // Adiciona questão do banco
deleteQuestion(id)           // Remove questão por ID
updateImage(...)             // Adiciona imagem ao texto/questão
removeImage(...)             // Remove imagem do texto/questão
```

---

### `hooks/useActivityGenerator.ts`
Responsável pela geração de atividades.

**Fluxo:**
1. Chama `POST /api/generate-activity` com os parâmetros do professor
2. Se a API responder com sucesso → cria atividade com dados da IA
3. Se a API falhar → ativa **fallback local**:
   - Seleciona um template pré-pronto compatível com a matéria
   - Adapta com os dados do professor (nome, escola, tema)
4. Em ambos os casos → consome 20 créditos do professor

---

### `components/InlineEditors.tsx`
Dois componentes para edição inline no documento:

| Componente | Uso | Salva com Enter? |
|---|---|---|
| `InlineEditInput` | Título, escola, professor | ✅ Sim |
| `InlineEditTextarea` | Texto base, enunciados, notas | ❌ Não (permite quebra de linha) |

**Técnica de performance:** cada componente mantém seu próprio estado `val` local.
Isso evita que cada tecla digitada re-renderize o documento inteiro — apenas o campo
em edição re-renderiza.

---

### `utils/exportWord.ts`
Exporta a atividade como arquivo `.doc` para download.

**Técnica usada:**
- Monta um HTML completo com namespaces XML do Microsoft Office
- Empacota como `Blob` com MIME type `application/msword`
- Cria um link `<a>` temporário e dispara o download programaticamente
- O prefixo `\ufeff` (BOM) garante encoding UTF-8 correto no Word

**Seções geradas:**
1. Cabeçalho (escola, aluno, data, professor)
2. Título centralizado
3. Texto base (se existir)
4. Questões numeradas com alternativas formatadas por tipo
5. Gabarito (em página separada, se habilitado)

---

### `utils/styleClasses.ts`
Mapa dos 4 temas visuais para classes Tailwind CSS.

| Tema | Estilo | Público-alvo |
|---|---|---|
| `modern-professional` | Clean, sombras suaves, sans-serif | Ensino Fundamental II / Médio |
| `ludic-childish` | Colorido, bordas arredondadas, tracejado | Anos Iniciais (1º-5º) |
| `minimalist` | Monocromático, sem sombras, mono | Qualquer série |
| `classic-traditional` | Serifa, itálico, bordas duplas | Provas formais / vestibular |

---

## Tabs da Interface

| Tab | Rota interna | Descrição |
|---|---|---|
| Gerador com IA | `gerador` | Editor principal com prévia A4 + painéis laterais |
| Dashboard | `dashboard` | Estatísticas, templates prontos e upgrade |
| Minhas Atividades | `minhas-atividades` | Portfólio completo com busca e filtros |
| Configurações | `configuracoes` | Perfil da escola, professor e preferências |

---

## Persistência de Dados

O EduMaker usa **`localStorage`** para salvar o portfólio localmente no navegador:

```ts
// Chave: "edumaker_activities"
// Valor: JSON.stringify(Activity[])
localStorage.setItem("edumaker_activities", JSON.stringify(activities));
```

Isso significa que os dados **não sincronizam entre dispositivos** — ficam apenas
no navegador onde foram criados. Para multi-dispositivo, seria necessário um backend.

---

## Como Integrar os Módulos no App.tsx

```tsx
import { useActivities } from "./hooks/useActivities";
import { useActivityGenerator } from "./hooks/useActivityGenerator";
import { InlineEditInput, InlineEditTextarea } from "./components/InlineEditors";
import { exportToWord } from "./utils/exportWord";
import { getStyleClasses } from "./utils/styleClasses";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({ ... });
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>({ ... });

  const {
    activities, activeDoc, filteredActivities,
    addActivity, updateActiveDoc, deleteActivity,
    updateDocColor, updateDocFont, updateDocStyle,
    togglePageOption, appendQuestion, deleteQuestion,
    updateImage, removeImage,
  } = useActivities(searchQuery);

  const { loading, errorInfo, generateActivity } = useActivityGenerator(
    addActivity,
    () => setTeacherProfile(prev => ({ ...prev, credits: Math.max(0, prev.credits - 20) }))
  );

  const currentStyles = getStyleClasses(activeDoc.visual.style);

  // ... resto do componente
}
```