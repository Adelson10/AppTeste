import { Activity } from "../types";

// PRE-BAKED PREMIUM ACTIVITIES (Aligned to BNCC for instant flawless offline experience)
export const PRE_BAKED_ACTIVITIES: Activity[] = [
  {
    id: "act-portuguese-8",
    title: "Atividade de Língua Portuguesa",
    schoolName: "COLÉGIO EXEMPLO",
    teacherName: "Prof. Pedro",
    createdAt: "2026-05-19T22:00:00Z",
    config: {
      subject: "Língua Portuguesa",
      grade: "8º Ano e Ensino Fundamental",
      theme: "Interpretação de Texto",
      bncc: "EF69LP44, EF69LP45",
      numQuestions: 5,
      questionTypes: { multipleChoice: true, trueFalse: true, essay: true, passage: true }
    },
    visual: {
      style: "modern-professional",
      color: "#3B82F6", // Blue
      fontFamily: "Inter"
    },
    pages: {
      schoolHeader: true,
      footerPage: true,
      gabarito: true,
      spaceForAnswers: true,
      linesForEssay: true
    },
    readingPassage: {
      title: "A importância da leitura",
      text: "A leitura é uma das atividades mais importantes para o desenvolvimento humano. Por meio dela, ampliamos nosso vocabulário, melhoramos a nossa capacidade de interpretação de mundo e desenvolvemos o pensamento crítico.\n\nAlém disso, a leitura proporciona entretenimento, cultura e conhecimento. Livros, revistas, jornais e textos digitais são pontes que enriquecem nossa vida diária e estimulam nossa criatividade.\n\nPortanto, criar o hábito de leitura desde cedo é essencial para formar cidadãos mais conscientes, informados e preparados para os desafios de um mundo dinâmico.",
      source: "https://www.todamateria.com.br/importancia-da-leitura/"
    },
    questions: [
      {
        id: 1,
        type: "multiple-choice",
        prompt: "Qual é o assunto principal tratado pelo texto?",
        options: [
          "A importância da escrita nos meios digitais.",
          "Os benefícios cognitivos e sociais da leitura regular.",
          "A história da criação dos livros infantis.",
          "As principais revistas de entretenimento do Brasil."
        ],
        correctAnswer: "B",
        explanation: "O texto enfatiza que a leitura nos ajuda no desenvolvimento crítico, de vocabulário e interpretação, o que representa os benefícios da leitura."
      },
      {
        id: 2,
        type: "multiple-choice",
        prompt: "De acordo com o segundo parágrafo, os diferentes tipos de publicação (livros, revistas, jornais e digitais) funcionam como:",
        options: [
          "Melhorias exclusivas para estudantes do ensino infantil.",
          "Aumento significativo da preguiça crônica.",
          "Pontes que enriquecem a nossa vivência diária e criatividade.",
          "Obstáculos para as relações sociais e profissionais modernas."
        ],
        correctAnswer: "C",
        explanation: "O segundo parágrafo aponta categoricamente que estes suportes são 'pontes que enriquecem nossa vida diária e estimulam nossa criatividade'."
      },
      {
        id: 3,
        type: "true-false",
        prompt: "Classifique em Verdadeiro (V) ou Falso (F) as seguintes proposições baseadas no texto:",
        options: [
          "A leitura constante ajuda a restringir o vocabulário das pessoas.",
          "O pensamento crítico é estimulado e aprimorado por meio do hábito da leitura.",
          "A leitura é descrita pelo autor como uma atividade meramente mecânica e sem fins intelectuais."
        ],
        correctAnswer: "F, V, F",
        explanation: "A primeira é falsa (leitura amplia e não restringe); a segunda é verdadeira; a terceira é falsa (é descrita como enriquecedora e libertadora)."
      },
      {
        id: 4,
        type: "essay",
        prompt: "Em sua opinião, de que maneira a escola e a família podem colaborar juntas para estimular o hábito de leitura em crianças e adolescentes?",
        correctAnswer: "Resposta esperada: O aluno deve destacar iniciativas como rodas de conversa, clubes do livro, contação de histórias domésticas e bibliotecas abertas acessíveis.",
        explanation: "Avalie a coerência textual do estudante, a ortografia e a pertinência com a cooperação entre escola e família para o incentivo da leitura."
      },
      {
        id: 5,
        type: "essay",
        prompt: "Qual é a relação indicada pelo autor entre o hábito de leitura precoce e a preparação para o futuro social do cidadão?",
        correctAnswer: "Resposta esperada: O autor afirma expressamente que ler desde cedo forma cidadãos mais conscientes, preparados e informados para os dilemas globais.",
        explanation: "Espera-se que o aluno relacione leitura precoce à cidadania, consciência social e enfrentamento de desafios globais destacados no último parágrafo."
      }
    ],
    gabaritoNotes: "Atividade recomendada para complementar a semana de incentivo nacional ao livro infantil. Pode ser aplicada em 50 minutos de aula regular."
  },
  {
    id: "act-math-6",
    title: "Atividade de Matemática - Frações",
    schoolName: "COLÉGIO EXEMPLO",
    teacherName: "Prof. Pedro",
    createdAt: "2026-05-18T14:30:00Z",
    config: {
      subject: "Matemática",
      grade: "6º Ano e Ensino Fundamental",
      theme: "Frações no Cotidiano",
      bncc: "EF06MA07, EF06MA08",
      numQuestions: 4,
      questionTypes: { multipleChoice: true, trueFalse: false, essay: true, passage: true }
    },
    visual: {
      style: "modern-professional",
      color: "#10B981", // Green
      fontFamily: "Outfit"
    },
    pages: {
      schoolHeader: true,
      footerPage: true,
      gabarito: true,
      spaceForAnswers: true,
      linesForEssay: true
    },
    readingPassage: {
      title: "Frações na Cozinha de Dona Benta",
      text: "Para fazer um delicioso bolo de cenoura, Dona Benta precisa usar várias proporções de ingredientes. Ela utiliza 1/2 xícara de óleo, 3/4 xícara de açúcar refinado e 2/3 de colher de fermento químico.\n\nSaber manusear essas medidas fracionárias é crucial para o sucesso da receita. Sem essa exatidão, o bolo pode solar ou ficar excessivamente doce.",
      source: "Matemática Criativa Aplicada"
    },
    questions: [
      {
        id: 1,
        type: "multiple-choice",
        prompt: "Qual dos ingredientes utilizados por Dona Benta representa a MAIOR quantidade em fração de xícara?",
        options: [
          "O óleo, que equivale a 1/2 (0,50) da xícara.",
          "O açúcar refinado, que equivale a 3/4 (0,75) da xícara.",
          "Estão todos em quantidades idênticas.",
          "O fermento, pois colheres são sempre maiores em frações."
        ],
        correctAnswer: "B",
        explanation: "3/4 é igual a 0.75, enquanto 1/2 is 0.50. Portanto, a porção de açúcar refinado é maior."
      },
      {
        id: 2,
        type: "multiple-choice",
        prompt: "Se Dona Benta decidir dobrar a receita inteira do bolo de cenoura, qual será a nova fração ideal para a quantidade de óleo?",
        options: [
          "1/4 xícara.",
          "2/4 xícaras.",
          "1 xícara inteira (1/2 + 1/2 = 1).",
          "1/2 xícara de óleo."
        ],
        correctAnswer: "C",
        explanation: "O dobro de 1/2 xícara é feito multiplicando 1/2 por 2, o que gera 2/2 = 1 xícara inteira."
      },
      {
        id: 3,
        type: "essay",
        prompt: "Dona Benta começou a fazer o bolo e percebeu que tinha apenas 1/4 de xícara de óleo disponível na despensa. Calcule quanto de óleo ainda falta para atingir a medida original exigida.",
        correctAnswer: "Resposta esperada: Faltam 1/4 xícara. Cálculo: 1/2 - 1/4 = 2/4 - 1/4 = 1/4.",
        explanation: "Avalie o raciocínio matemático de subtração de frações com denominadores de valores diferentes."
      },
      {
        id: 4,
        type: "essay",
        prompt: "Explique filosoficamente como o conhecimento sobre frações pode nos ajudar em atividades simples e comerciais no nosso cotidiano, além de receitas de culinária.",
        correctAnswer: "Resposta esperada: Divisão de contas, controle financeiro, fatiamento de recursos públicos, medição de terrenos rurais e fracionamento de tempo produtivo.",
        explanation: "O estudante deve citar pelo menos dois exemplos práticos de uso comercial das frações."
      }
    ],
    gabaritoNotes: "Foco pedagógico: Operações lógicas básicas e raciocínio de equivalência de denominadores de frações."
  }
];

// BNCC Question Bank repository for instant Click-to-Add action
export const QUESTION_BANK_TEMPLATES = [
  {
    discipline: "Língua Portuguesa",
    bncc: "EF69LP55",
    grade: "7º/8º Ano",
    prompt: "Identifique nas seguintes orações o adjunto adnominal em destaque:",
    type: "multiple-choice",
    options: ["O belo pôr do sol encantou os turistas.", "Eles caminharam silenciosamente pela praia.", "O aluno comprou um livro didático útil.", "A chuva forte alagou as largas avenidas."],
    correctAnswer: "A",
    explanation: "Em 'O belo pôr', as palavras referem-se diretamente ao núcleo do sujeito.",
    theme: "Sintaxe da Oração"
  },
  {
    discipline: "Matemática",
    bncc: "EF07MA04",
    grade: "7º Ano",
    prompt: "Uma loja oferece um desconto de 15% para pagamentos em pix. Se uma calça custa R$ 120,00, qual o valor real com o desconto aplicado?",
    type: "multiple-choice",
    options: ["R$ 105,00", "R$ 102,00 (15% de 120 = 18; 120 - 18 = 102)", "R$ 110,00", "R$ 98,00"],
    correctAnswer: "B",
    explanation: "15% de 120 equivale a 18 reais de desconto. O preço cai para R$ 102,00.",
    theme: "Porcentagem"
  },
  {
    discipline: "Ciências",
    bncc: "EF06CI04",
    grade: "6º Ano",
    prompt: "Explique como ocorre o ciclo da água na biosfera, detalhando o papel da evaporação e da transpiração dos seres vivos.",
    type: "essay",
    options: [],
    correctAnswer: "Resposta: O calor solar evapora a água de superfícies líquidas. A evapotranspiração dos vegetais e transpiração animal somam vapor d'água no ar, que se condensa e precipita como chuva.",
    explanation: "Compreensão dos fenômenos físicos da mudança de estados gasoso e líquido.",
    theme: "Ciclos Naturais"
  },
  {
    discipline: "História",
    bncc: "EF09HI01",
    grade: "9º Ano",
    prompt: "Explique as principais diferenças administrativas e civis entre a Primeira República brasileira (Coronelismo) e o período imperial antecedente.",
    type: "essay",
    options: [],
    correctAnswer: "Resposta esperada: Ênfase na descentralização política sob a política dos governadores, o voto de cabresto controlado pelas oligarquias agrárias e ausência de poder moderador.",
    explanation: "Análise histórica crítica de estruturas oligárquicas republicanas.",
    theme: "Primeira República"
  },
  {
    discipline: "Geografia",
    bncc: "EF08GE15",
    grade: "8º Ano",
    prompt: "Qual dos seguintes blocos representa a maior integração comercial na região das Américas do Sul e Latina?",
    type: "multiple-choice",
    options: [
      "Mercosul (Mercado Comum do Sul)",
      "União Europeia",
      "OTAN",
      "Liga Árabe de Negócios"
    ],
    correctAnswer: "A",
    explanation: "Mercosul é uma união aduaneira relevante de comércio geográfico latino.",
    theme: "Geopolítica"
  }
];
