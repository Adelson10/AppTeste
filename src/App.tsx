import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Layers,
  Sliders,
  Download,
  BookOpen,
  Settings,
  Plus,
  Search,
  Share2,
  Printer,
  FileText,
  Check,
  CheckCircle,
  User,
  Calendar,
  ChevronRight,
  ChevronLeft,
  School,
  Edit2,
  Trash2,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Square,
  Grid,
  Clock,
  Key,
  Save,
  Bookmark,
  CheckSquare,
  FileSpreadsheet,
  Image,
  X
} from "lucide-react";
import { Activity, Question, ReadingPassage, SchoolProfile, TeacherProfile, ActivityConfig, VisualConfig, PageOptions } from "./types";
import { PRE_BAKED_ACTIVITIES, QUESTION_BANK_TEMPLATES } from "./data/prebaked";

// High-performance local state wrappers to prevent entire app rerendering during text input
interface InlineEditInputProps {
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  className?: string;
  autoFocus?: boolean;
}

const InlineEditInput: React.FC<InlineEditInputProps> = ({
  value: initialValue,
  onSave,
  onCancel,
  className,
  autoFocus = true,
}) => {
  const [val, setVal] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave(val);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(val)}
      onKeyDown={handleKeyDown}
      className={className}
      autoFocus={autoFocus}
    />
  );
};

interface InlineEditTextareaProps {
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  className?: string;
  rows?: number;
  autoFocus?: boolean;
}

const InlineEditTextarea: React.FC<InlineEditTextareaProps> = ({
  value: initialValue,
  onSave,
  onCancel,
  className,
  rows = 3,
  autoFocus = true,
}) => {
  const [val, setVal] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(val)}
      onKeyDown={handleKeyDown}
      className={className}
      rows={rows}
      autoFocus={autoFocus}
    />
  );
};

export default function App() {
  // STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState<"gerador" | "dashboard" | "minhas-atividades" | "configuracoes">("gerador");
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("edumaker_activities");
    return saved ? JSON.parse(saved) : PRE_BAKED_ACTIVITIES;
  });
  const [activeDoc, setActiveDoc] = useState<Activity>(() => {
    const defaultAct = activities.length > 0 ? activities[0] : PRE_BAKED_ACTIVITIES[0];
    return defaultAct;
  });
  
  // Active sheet editing triggers
  const [editingField, setEditingField] = useState<{ type: "school" | "teacher" | "title" | "passage-title" | "passage-text" | "question-prompt" | "gabarito-notes"; id?: number } | null>(null);
  const [activeImagePicker, setActiveImagePicker] = useState<{ type: "passage" | "question"; id?: number } | null>(null);
  const [customImageQuery, setCustomImageQuery] = useState("");

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    name: "COLÉGIO EXEMPLO",
    segment: "Ensino Fundamental II",
    logoType: "shield"
  });

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>({
    name: "Prof. Pedro",
    role: "Professor Pedagogo",
    credits: 1250,
    savedCount: 22
  });

  // Generator parameters configuration state
  const [genConfig, setGenConfig] = useState<ActivityConfig>({
    subject: "Língua Portuguesa",
    grade: "8º Ano do Ensino Fundamental",
    theme: "Interpretação de Texto",
    bncc: "EF69LP44, EF69LP45",
    numQuestions: 5,
    questionTypes: {
      multipleChoice: true,
      trueFalse: true,
      essay: true,
      passage: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<"preview" | "questions" | "gabarito">("preview");
  const [zoomRatio, setZoomRatio] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Optimization: Memoize filtered activities list with dependency tracking to avoid computation on every render
  const filteredActivities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activities;
    return activities.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.config.subject.toLowerCase().includes(q)
    );
  }, [activities, searchQuery]);
  // Save changes locally whenever activities or activeDoc changes
  useEffect(() => {
    localStorage.setItem("edumaker_activities", JSON.stringify(activities));
  }, [activities]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switch visual color helper
  const updateDocColor = (hex: string) => {
    const updated = { ...activeDoc, visual: { ...activeDoc.visual, color: hex } };
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast("Cor do modelo atualizada!");
  };

  const updateDocFont = (font: string) => {
    const updated = { ...activeDoc, visual: { ...activeDoc.visual, fontFamily: font } };
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast(`Fonte alterada para ${font}!`);
  };

  const updateDocStyle = (style: 'modern-professional' | 'ludic-childish' | 'minimalist' | 'classic-traditional') => {
    const updated = { ...activeDoc, visual: { ...activeDoc.visual, style } };
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast("Estilo visual atualizado!");
  };

  const togglePageOption = (key: keyof PageOptions) => {
    const updated = {
      ...activeDoc,
      pages: { ...activeDoc.pages, [key]: !activeDoc.pages[key] }
    };
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  // Call the Premium EduMaker AI generation service
  const handleGenerateWithAI = async () => {
    setLoading(true);
    setErrorInfo(null);
    triggerToast("Elaborando sua atividade inteligente em tempo real...");

    try {
      const response = await fetch("/api/generate-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: genConfig })
      });

      if (!response.ok) {
        throw new Error("Não foi possível gerar a atividade automaticamente. Por favor, tente novamente em alguns instantes ou ajuste os critérios.");
      }

      const data = await response.json();
      
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
          fontFamily: "Inter"
        },
        pages: {
          schoolHeader: true,
          footerPage: true,
          gabarito: true,
          spaceForAnswers: true,
          linesForEssay: true
        },
        readingPassage: data.readingPassage ? {
          title: data.readingPassage.title,
          text: data.readingPassage.text,
          source: data.readingPassage.source || "EduMaker IA"
        } : undefined,
        questions: data.questions || [],
        gabaritoNotes: data.gabaritoNotes || ""
      };

      setActivities(prev => [newActivity, ...prev]);
      setActiveDoc(newActivity);
      setTeacherProfile(prev => ({ ...prev, credits: Math.max(0, prev.credits - 20) }));
      triggerToast("Atividade personalizada gerada com IA com sucesso pelas diretrizes BNCC!");
    } catch (err: any) {
      console.warn("Generating via AI failed, falling back to instant client compile engine.", err);
      setErrorInfo(err?.message || "Erro de Conectividade. Usamos o mecanismo local de compilação instantânea.");
      
      // FALLBACK PEDAGÓGICO INSTANTÂNEO
      // We look if there is a pre-baked activity for the requested subject or generate one
      const sampleSubject = genConfig.subject.toLowerCase();
      let selectedSample = PRE_BAKED_ACTIVITIES[0]; // defaults to Portuguese
      if (sampleSubject.includes("mat") || sampleSubject.includes("núm")) {
        selectedSample = PRE_BAKED_ACTIVITIES[1];
      }

      const newFallbackDoc: Activity = {
        id: `act-gen-${Date.now()}`,
        title: `Atividade de ${genConfig.subject} (${genConfig.theme})`,
        schoolName: schoolProfile.name,
        teacherName: teacherProfile.name,
        createdAt: new Date().toISOString(),
        config: { ...genConfig },
        visual: {
          style: "modern-professional",
          color: "#4F46E5", // Indigo fallback
          fontFamily: "Inter"
        },
        pages: {
          schoolHeader: true,
          footerPage: true,
          gabarito: true,
          spaceForAnswers: true,
          linesForEssay: true
        },
        readingPassage: genConfig.questionTypes.passage ? selectedSample.readingPassage : undefined,
        questions: [...selectedSample.questions].map((q, idx) => ({ ...q, id: idx + 1 })),
        gabaritoNotes: "Atividade compilada pelo motor inteligente nativo do EduMaker."
      };

      setActivities(prev => [newFallbackDoc, ...prev]);
      setActiveDoc(newFallbackDoc);
      setTeacherProfile(prev => ({ ...prev, credits: Math.max(0, prev.credits - 20) }));
      triggerToast("Atividade compilada instantaneamente com o banco normativo EduMaker!");
    } finally {
      setLoading(false);
    }
  };

  // DIRECT TEXT EDITS (Google Docs & Figma style)
  const saveFieldEdit = (newValue: string) => {
    if (!editingField) return;
    
    let updated = { ...activeDoc };
    const value = newValue.trim();

    if (editingField.type === "school") {
      updated.schoolName = value;
      setSchoolProfile(prev => ({ ...prev, name: value }));
    } else if (editingField.type === "teacher") {
      updated.teacherName = value;
      setTeacherProfile(prev => ({ ...prev, name: value }));
    } else if (editingField.type === "title") {
      updated.title = value;
    } else if (editingField.type === "passage-title" && updated.readingPassage) {
      updated.readingPassage.title = value;
    } else if (editingField.type === "passage-text" && updated.readingPassage) {
      updated.readingPassage.text = value;
    } else if (editingField.type === "gabarito-notes") {
      updated.gabaritoNotes = value;
    } else if (editingField.type === "question-prompt" && editingField.id !== undefined) {
      updated.questions = updated.questions.map(q => 
        q.id === editingField.id ? { ...q, prompt: value } : q
      );
    }

    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditingField(null);
    triggerToast("Documento atualizado com sucesso!");
  };

  // Add question to active doc
  const handleAppendQuestion = (qTemplate: typeof QUESTION_BANK_TEMPLATES[0]) => {
    const newId = activeDoc.questions.length > 0 ? Math.max(...activeDoc.questions.map(q => q.id)) + 1 : 1;
    const newQ: Question = {
      id: newId,
      type: qTemplate.type as "multiple-choice" | "essay",
      prompt: qTemplate.prompt,
      options: qTemplate.options.length > 0 ? [...qTemplate.options] : undefined,
      correctAnswer: qTemplate.correctAnswer,
      explanation: qTemplate.explanation
    };

    const updated = {
      ...activeDoc,
      questions: [...activeDoc.questions, newQ]
    };
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast(`Questão sobre ${qTemplate.theme} inserida no final do documento!`);
  };

  // Remove question
  const handleDeleteQuestion = (qId: number) => {
    const updated = {
      ...activeDoc,
      questions: activeDoc.questions.filter(q => q.id !== qId)
    };
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast("Questão removida!");
  };

  const handleUpdateImage = (type: "passage" | "question", imageUrl: string, imagePrompt?: string, questionId?: number) => {
    let updated = { ...activeDoc };
    if (type === "passage" && updated.readingPassage) {
      updated.readingPassage = { ...updated.readingPassage, imageUrl, imagePrompt };
    } else if (type === "question" && questionId !== undefined) {
      updated.questions = updated.questions.map(q => 
        q.id === questionId ? { ...q, imageUrl, imagePrompt } : q
      );
    }
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast("Ilustração atualizada de forma inteligente!");
  };

  const handleRemoveImage = (type: "passage" | "question", questionId?: number) => {
    let updated = { ...activeDoc };
    if (type === "passage" && updated.readingPassage) {
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
    setActiveDoc(updated);
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    triggerToast("Ilustração removida!");
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast("Link de compartilhamento copiado! Qualquer professor pode visualizar.");
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // Generate downloadable word document 1:1 format match
  const handleExportWord = () => {
    const title = activeDoc.title || "Atividade Escolar";
    const headerHtml = activeDoc.pages.schoolHeader ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 3px double #333333; padding-bottom: 12px;">
        <tr>
          <td style="width: 60%; vertical-align: top;">
            <div style="font-size: 16pt; font-weight: bold; font-family: 'Arial'; color: #111111;">${activeDoc.schoolName || "COLÉGIO EXEMPLO"}</div>
            <div style="font-size: 9.5pt; color: #555555; font-family: 'Arial'; margin-top: 2px;">${schoolProfile.segment || "Educação Básica de Qualidade"}</div>
          </td>
          <td style="width: 40%; vertical-align: top; text-align: right;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; font-family: 'Arial'; border: 1px solid #cccccc; text-align: left;">
              <tr><td style="padding: 4px; border: 1px solid #cccccc;"><b>Aluno(a):</b> __________________________________</td></tr>
              <tr><td style="padding: 4px; border: 1px solid #cccccc;"><b>Turma:</b> _________ &nbsp; <b>Data:</b> ___/___/______</td></tr>
              <tr><td style="padding: 4px; border: 1px solid #cccccc;"><b>Professor(a):</b> ${activeDoc.teacherName || "Prof. Pedro"}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    ` : "";

    const passageHtml = activeDoc.readingPassage ? `
      <div style="background-color: #fafafa; border-left: 5px solid ${activeDoc.visual.color}; padding: 12px; margin-bottom: 24px; font-family: 'Georgia', serif; font-size: 11pt;">
        <div style="font-weight: bold; font-size: 12pt; margin-bottom: 6px; text-transform: uppercase;">${activeDoc.readingPassage.title}</div>
        <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${activeDoc.readingPassage.text}</p>
        ${activeDoc.readingPassage.source ? `<div style="text-align: right; font-size: 9pt; color: #666666; margin-top: 8px;"><i>Fonte: ${activeDoc.readingPassage.source}</i></div>` : ""}
      </div>
    ` : "";

    const questionsHtml = activeDoc.questions.map((q, idx) => {
      let qContent = "";
      if (q.type === "multiple-choice" && q.options) {
        qContent = q.options.map((opt, oIdx) => `
          <div style="margin-left: 20px; margin-top: 6px; font-family: 'Arial'; font-size: 10.5pt;">
            <b>${String.fromCharCode(65 + oIdx)})</b> ${opt}
          </div>
        `).join("");
      } else if (q.type === "true-false" && q.options) {
        qContent = q.options.map((opt, oIdx) => `
          <div style="margin-left: 20px; margin-top: 6px; font-family: 'Arial'; font-size: 10.5pt;">
            ( &nbsp; ) &nbsp; ${opt}
          </div>
        `).join("");
      } else if (q.type === "essay") {
        const lines = activeDoc.pages.linesForEssay ? `<div style="border-bottom: 1px dotted #888888; height: 25px; margin-top: 10px; width: 100%;"></div>`.repeat(3) : "";
        qContent = lines || `<div style="height: 60px;"></div>`;
      }

      const spacing = activeDoc.pages.spaceForAnswers ? '<div style="height: 15px;"></div>' : '';

      return `
        <div style="margin-bottom: 22px; font-family: 'Arial';">
          <div style="font-weight: bold; font-size: 11pt;">${idx + 1}) ${q.prompt}</div>
          ${qContent}
          ${spacing}
        </div>
      `;
    }).join("");

    const gabaritoHtml = activeDoc.pages.gabarito ? `
      <div style="page-break-before: always; margin-top: 40px; border-top: 2px dashed #ff3b30; padding-top: 25px;">
        <div style="font-size: 14pt; font-weight: bold; color: #ff3b30; font-family: 'Arial'; margin-bottom: 15px; text-transform: uppercase;">GABARITO OFICIAL - EXCLUSIVO PARA O PROFESSOR</div>
        ${activeDoc.questions.map((q, idx) => `
          <div style="margin-bottom: 15px; font-family: 'Arial'; font-size: 10pt;">
            <div><b>Questão ${idx + 1}:</b> Resposta Oficial: <strong style="color: #2f855a; background-color: #f0fff4; padding: 2px 5px; border-radius: 3px;">${q.correctAnswer}</strong></div>
            <div style="color: #666666; margin-left: 15px; margin-top: 3px;"><i>Diretriz: ${q.explanation}</i></div>
          </div>
        `).join("")}
        ${activeDoc.gabaritoNotes ? `
          <div style="margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 10px; font-family: 'Arial'; font-size: 9.5pt; color: #555555;">
            <b>Orientações Complementares:</b> ${activeDoc.gabaritoNotes}
          </div>
        ` : ""}
      </div>
    ` : "";

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
      </head>
      <body style="padding: 40px; max-width: 800px; margin: auto;">
        ${headerHtml}
        <div style="text-align: center; font-size: 14pt; font-weight: bold; font-family: 'Arial'; margin: 20px 0; text-transform: uppercase; color: ${activeDoc.visual.color};">
          ${activeDoc.title}
        </div>
        ${passageHtml}
        ${questionsHtml}
        ${gabaritoHtml}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Documento exportado com a diagramação premium do Word!");
  };

  // Switch style variables generator for active doc sheet
  const getStyleClasses = () => {
    switch (activeDoc.visual.style) {
      case "ludic-childish":
        return {
          card: "rounded-[24px] border-4 bg-[#FFFDF2] p-8",
          headerDivider: "border-b-4 border-dashed pb-4 mb-6",
          badge: "font-outfit rounded-full px-4 py-1 text-xs font-bold ring-2",
          font: "font-outfit",
          title: "text-2xl font-extrabold text-center uppercase tracking-wide",
          questionNumber: "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white",
          passageBox: "bg-[#FFF9E6] border-2 rounded-[16px] p-5 my-6 relative shadow-sm"
        };
      case "minimalist":
        return {
          card: "rounded-none border-t-[6px] bg-white p-6 shadow-none",
          headerDivider: "border-b pb-3 mb-5",
          badge: "rounded-none px-3 py-0.5 text-[10px] font-mono tracking-widest uppercase text-white",
          font: "font-grotesk",
          title: "text-lg font-bold text-neutral-950 text-center uppercase tracking-wider",
          questionNumber: "w-6 h-6 rounded-none text-white flex items-center justify-center font-mono text-xs",
          passageBox: "pl-4 border-l my-4 py-1 italic text-neutral-700"
        };
      case "classic-traditional":
        return {
          card: "rounded-[4px] border border-neutral-300 bg-white p-10 shadow-lg",
          headerDivider: "border-b-4 border-double pb-4 mb-6",
          badge: "bg-neutral-200 text-neutral-850 font-serif border px-3 py-1 text-xs italic",
          font: "font-serif",
          title: "text-2xl font-bold font-serif text-neutral-900 text-center italic tracking-normal border-b pb-2",
          questionNumber: "w-7 h-7 rounded-full border-2 flex items-center justify-center font-serif font-bold text-xs",
          passageBox: "bg-neutral-50 border p-6 my-6 italic text-[11.5pt] font-serif leading-relaxed text-neutral-800"
        };
      default: // modern-professional
        return {
          card: "rounded-[16px] border border-neutral-100 bg-white p-8 shadow-xl",
          headerDivider: "border-b-2 pb-4 mb-5",
          badge: "font-inter rounded-md px-2.5 py-0.5 text-xs font-semibold border uppercase tracking-tight",
          font: "font-inter",
          title: "text-xl font-extrabold text-neutral-800 text-center uppercase tracking-tight",
          questionNumber: "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs",
          passageBox: "bg-neutral-50/70 border-l-4 rounded-r-lg p-5 my-5 leading-relaxed text-neutral-700 font-inter"
        };
    }
  };

  const currentStyles = getStyleClasses();

  // Dynamic responsive sizing calculations
  const isMobileOrTablet = windowWidth < 1024;
  // Account for parent container padding (e.g. p-4 on mobile = 32px gap)
  const availableWidth = isMobileOrTablet ? (windowWidth - 32) : 800;
  // Calculate dynamic scale relative to 800px standard worksheet width
  const responsiveScaleFactor = isMobileOrTablet ? Math.min(1, availableWidth / 800) : 1;
  const finalScale = (zoomRatio / 100) * responsiveScaleFactor;

  return (
    <div id="edumaker-app" className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-inter">
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[999] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-transform duration-300 animate-bounce">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="no-print h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">
              Edu<span className="text-indigo-600">Maker</span>
            </span>
            <span className="ml-2 bg-indigo-500/10 text-indigo-700 font-outfit px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase">
              Premium
            </span>
          </div>
        </div>

        {/* Search bar inside header tab */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar nas minhas atividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none text-slate-700"
          />
        </div>

        {/* Global info controls */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 rounded-xl px-3 py-1.5 hidden sm:flex flex-col text-right">
            <div className="flex items-center justify-end gap-1.5 text-[11px] font-extrabold text-slate-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>EduMaker AI Online</span>
            </div>
            <div className="text-[9px] text-indigo-600/80 font-semibold -mt-0.5">✨ IA Educacional Premium Ativa</div>
          </div>
          
          <button
            onClick={() => setActiveTab("configuracoes")}
            className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 border text-slate-600 hover:text-indigo-600 border-slate-200 font-bold px-3 py-2 rounded-xl transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferências</span>
          </button>
          
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              PP
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-bold text-slate-700">{teacherProfile.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{teacherProfile.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* BODY PLATFORM VIEW */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* SIDEBAR LEFT (SaaS Navigation & Context info) */}
        <aside className="no-print lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Nova Atividade CTA button */}
            <button
              onClick={() => {
                setActiveTab("gerador");
                triggerToast("Configure os parâmetros ao lado para gerar à atividade.");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 text-indigo-200" />
              <span>Nova Atividade</span>
            </button>

            {/* Menu options list */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "dashboard" ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("minhas-atividades")}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "minhas-atividades" ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Minhas Atividades</span>
                <span className="ml-auto bg-slate-800 px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400">
                  {activities.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("gerador")}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "gerador" ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span>Gerador com IA</span>
              </button>

              <button
                onClick={() => setActiveTab("configuracoes")}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "configuracoes" ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </button>
            </nav>

            {/* Escola ativa Card widget */}
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded">
                  <School className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-white tracking-wide truncate">{schoolProfile.name}</div>
                  <div className="text-[10px] text-slate-400">{schoolProfile.segment}</div>
                </div>
              </div>
              <button 
                onClick={() => setShowSchoolModal(true)}
                className="w-full text-center text-[10.5px] bg-slate-800 hover:bg-slate-700/85 text-indigo-400 hover:text-indigo-300 py-1.5 rounded transition font-medium"
              >
                Alterar escola ativa
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-10">
            {/* Créditos Premium widget */}
            <div className="p-3 bg-indigo-550/10 border border-indigo-500/20 rounded-xl space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-indigo-300">Créditos Premium</span>
                <span className="text-white">{teacherProfile.credits} restam</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, (teacherProfile.credits / 1500) * 100)}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-slate-400 pt-0.5">Renova em 25/06/2026</div>
            </div>

            {/* Footer and documentation link */}
            <div className="text-[10px] text-slate-500 text-center flex flex-col gap-0.5">
              <span>EduMaker SaaS v3.2</span>
              <span>Conforme diretrizes BNCC Brasil</span>
            </div>
          </div>
        </aside>

        {/* CONTAINER WORK SPACE */}
        <main className="flex-1 flex flex-col overflow-hidden">
          
          {/* TAB 1: GERADOR IA EDITOR (The primary workspace template) */}
          {activeTab === "gerador" && (
            <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto overflow-x-hidden bg-slate-100">
              
              {/* LEFT PARAMS CONTROLS PANEL */}
              <div className="no-print w-full lg:w-80 bg-white border-r border-slate-200 shrink-0 p-5 overflow-y-auto space-y-5">
                
                {/* Section title */}
                <div className="flex items-center gap-1.5 text-[#374151] font-bold text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>1. Conteúdo da Atividade</span>
                </div>

                {/* Subject picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Discipline / Matéria</label>
                  <select
                    value={genConfig.subject}
                    onChange={(e) => setGenConfig({ ...genConfig, subject: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Língua Portuguesa">Língua Portuguesa</option>
                    <option value="Matemática">Matemática</option>
                    <option value="Ciências">Ciências</option>
                    <option value="História flex">História</option>
                    <option value="Geografia">Geografia</option>
                    <option value="Inglês">Inglês</option>
                  </select>
                </div>

                {/* Grade / Serie Year */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Série / Ano</label>
                  <select
                    value={genConfig.grade}
                    onChange={(e) => setGenConfig({ ...genConfig, grade: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="5º Ano do Ensino Fundamental">5º Ano do Ensino Fundamental</option>
                    <option value="6º Ano do Ensino Fundamental">6º Ano do Ensino Fundamental</option>
                    <option value="7º Ano do Ensino Fundamental">7º Ano e Ensino Fundamental</option>
                    <option value="8º Ano do Ensino Fundamental">8º Ano do Ensino Fundamental</option>
                    <option value="9º Ano do Ensino Fundamental">9º Ano do Ensino Fundamental</option>
                  </select>
                </div>

                {/* Theme field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Tema Principal</label>
                  <input
                    type="text"
                    value={genConfig.theme}
                    onChange={(e) => setGenConfig({ ...genConfig, theme: e.target.value })}
                    placeholder="Ex: Interpretação de Clássicos, Frações..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* BNCC mapping */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600">Códigos BNCC</label>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" title="Insira as diretrizes normativas BNCC recomendadas" />
                  </div>
                  <input
                    type="text"
                    value={genConfig.bncc}
                    onChange={(e) => setGenConfig({ ...genConfig, bncc: e.target.value })}
                    placeholder="Ex: EF69LP44, EF06MA07"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Number of questions */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Quantidade de Questões</label>
                  <select
                    value={genConfig.numQuestions}
                    onChange={(e) => setGenConfig({ ...genConfig, numQuestions: parseInt(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="3">3 questões</option>
                    <option value="4">4 questões</option>
                    <option value="5">5 questões</option>
                    <option value="8">8 questões</option>
                    <option value="10">10 questões</option>
                  </select>
                </div>

                {/* Question Types switches */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tipos de Questões Desejados</label>
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={genConfig.questionTypes.multipleChoice}
                        onChange={(e) => setGenConfig({
                          ...genConfig,
                          questionTypes: { ...genConfig.questionTypes, multipleChoice: e.target.checked }
                        })}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <span>Múltipla Escolha</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={genConfig.questionTypes.trueFalse}
                        onChange={(e) => setGenConfig({
                          ...genConfig,
                          questionTypes: { ...genConfig.questionTypes, trueFalse: e.target.checked }
                        })}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <span>Verdadeiro ou Falso</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={genConfig.questionTypes.essay}
                        onChange={(e) => setGenConfig({
                          ...genConfig,
                          questionTypes: { ...genConfig.questionTypes, essay: e.target.checked }
                        })}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <span>Dissertativa / Discursiva</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none border-t border-slate-200 pt-1.5 mt-1.5">
                      <input
                        type="checkbox"
                        checked={genConfig.questionTypes.passage}
                        onChange={(e) => setGenConfig({
                          ...genConfig,
                          questionTypes: { ...genConfig.questionTypes, passage: e.target.checked }
                        })}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-900">Incluir Texto Base</span>
                    </label>
                  </div>
                </div>

                {/* AI generation triggering button */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={loading}
                    className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-[98] transition disabled:bg-indigo-400"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                        <span>Gerando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span>Gerar Atividade Completa</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">Usará 20 créditos pedagógicos premium</p>
                </div>

              </div>

              {/* CENTER A4 SHEET VISUAL WORKSPACE CANVAS PREVIEWER */}
              <div className="flex-1 flex flex-col min-w-0">
                
                {/* Visual toolbar bar (no-print) */}
                <div className="no-print h-12 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <button
                      onClick={() => setActiveSheetTab("preview")}
                      className={`text-xs px-3 py-1 rounded-md font-bold transition ${
                        activeSheetTab === "preview" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Pré-visualização
                    </button>
                    <button
                      onClick={() => setActiveSheetTab("questions")}
                      className={`text-xs px-3 py-1 rounded-md font-bold transition ${
                        activeSheetTab === "questions" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Questões ({activeDoc.questions.length})
                    </button>
                    <button
                      onClick={() => setActiveSheetTab("gabarito")}
                      className={`text-xs px-3 py-1 rounded-md font-bold transition ${
                        activeSheetTab === "gabarito" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Gabarito
                    </button>
                  </div>

                  {/* Document Zoom and page settings helper */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono tracking-tight hidden sm:inline">PAGINA-1_A4.doc</span>
                    
                    <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                      <button 
                        onClick={() => setZoomRatio(prev => Math.max(50, prev - 10))}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded transition"
                        title="Zoom out"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-600 w-10 text-center">{zoomRatio}%</span>
                      <button 
                        onClick={() => setZoomRatio(prev => Math.min(180, prev + 10))}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded transition"
                        title="Zoom in"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={`p-1.5 rounded text-xs transition ${isFullscreen ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
                      title="Alternar tela cheia"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Printable container view */}
                <div className={`flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start ${isFullscreen ? "fixed inset-0 bg-slate-850 z-50 pt-20" : ""}`}>
                  
                  {/* Sized scale-wrapper parent component that bounds the transformed A4 sheet layout on screen */}
                  <div 
                    className="scale-wrapper relative shrink-0 transition-all origin-top"
                    style={{
                      width: `${800 * finalScale}px`,
                      height: `${1123 * finalScale}px`,
                      maxWidth: "100%",
                      margin: "0 auto"
                    }}
                  >
                    {/* Actual Paper Canvas layout */}
                    <div 
                      id="worksheet-canvas"
                      className={`printable-area bg-white text-neutral-900 border border-neutral-200/70 p-12 absolute left-0 top-0 origin-top-left min-h-[1123px] w-[800px] shadow-2xl ${
                        currentStyles.font
                      }`}
                      style={{ 
                        transform: `scale(${finalScale})`, 
                        borderColor: activeDoc.visual.style === "ludic-childish" ? activeDoc.visual.color : undefined,
                        borderTopColor: activeDoc.visual.style === "minimalist" ? activeDoc.visual.color : undefined
                      }}
                    >
                    
                    {/* Header: School identifier information */}
                    {activeDoc.pages.schoolHeader && (
                      <div 
                        className={currentStyles.headerDivider}
                        style={{
                          borderColor: activeDoc.visual.style === "ludic-childish" ? activeDoc.visual.color : undefined,
                          borderBottomColor: activeDoc.visual.style !== "ludic-childish" ? activeDoc.visual.color : undefined
                        }}
                      >
                        <div className="flex items-start justify-between">
                          
                          {/* Decorated customizable logo badge */}
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg border flex items-center justify-center font-bold no-print group cursor-pointer relative"
                              style={{ 
                                backgroundColor: `${activeDoc.visual.color}15`, 
                                color: activeDoc.visual.color, 
                                borderColor: `${activeDoc.visual.color}35` 
                              }}
                              title="Alterar Estilo de Logo"
                            >
                              <School className="w-6 h-6" />
                              <span className="absolute -bottom-1 -right-1 bg-amber-400 w-3 h-3 rounded-full border border-white"></span>
                            </div>
                            <div>
                              {editingField?.type === "school" ? (
                                <InlineEditInput
                                  value={activeDoc.schoolName}
                                  onSave={saveFieldEdit}
                                  onCancel={() => setEditingField(null)}
                                  className="border-b border-indigo-500 outline-none text-base font-extrabold"
                                />
                              ) : (
                                <div 
                                  onClick={() => setEditingField({ type: "school" })}
                                  className="text-base font-extrabold hover:bg-neutral-50 p-1 rounded cursor-pointer leading-tight flex items-center gap-1.5"
                                  title="Clique para editar nome da escola"
                                >
                                  <span>{activeDoc.schoolName}</span>
                                  <Edit2 className="w-3.5 h-3.5 text-neutral-300 opacity-0 hover:opacity-100 transition no-print inline" />
                                </div>
                              )}
                              <div className="text-[10.5px] text-neutral-500 uppercase font-bold tracking-wider pl-1">{schoolProfile.segment}</div>
                            </div>
                          </div>
 
                          {/* Student identity fill-out blocks */}
                          <div className="bg-neutral-50/50 p-3 rounded-lg border border-neutral-100 text-xs text-neutral-700 leading-normal font-mono relative" style={{ width: "700px" }}>
                            <div className="mb-1.5 pb-1 border-b border-neutral-200">
                              <span className="font-bold text-neutral-400 uppercase text-[9px] block">Nome</span>
                              <div className="text-neutral-300">__________________________________________</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="pb-1 border-b border-neutral-200">
                                <span className="font-bold text-neutral-400 uppercase text-[9px] block">Turma / Ano</span>
                                <div className="text-neutral-800">{activeDoc.config.grade.split(" ")[0]} Ano</div>
                              </div>
                              <div className="pb-1 border-b border-neutral-200">
                                <span className="font-bold text-neutral-400 uppercase text-[9px] block">Data</span>
                                <div className="text-neutral-300">____/____/______</div>
                              </div>
                            </div>
                            <div className="mt-1.5 pt-1.5 border-t border-neutral-200 flex justify-between items-center bg-neutral-100/50 p-1 rounded">
                              <span className="font-bold text-neutral-500 text-[9px] uppercase">Prof: <b>{activeDoc.teacherName}</b></span>
                              <span className="font-bold text-red-500 text-[9px] uppercase" style={{ color: "#000000" }}>Nota: _______</span>
                            </div>
                          </div>
 
                        </div>
                      </div>
                    )}
 
                    {/* Standard title */}
                    <div className="my-6">
                      {editingField?.type === "title" ? (
                        <InlineEditInput
                          value={activeDoc.title}
                          onSave={saveFieldEdit}
                          onCancel={() => setEditingField(null)}
                          className="border-b-2 border-indigo-500 outline-none text-xl font-extrabold w-full text-center"
                        />
                      ) : (
                        <div 
                          onClick={() => setEditingField({ type: "title" })}
                          className={`group hover:bg-neutral-50 p-2 rounded cursor-pointer ${currentStyles.title} flex items-center justify-center gap-2`}
                          style={{
                            color: activeDoc.visual.style === "ludic-childish" ? activeDoc.visual.color : undefined,
                            borderBottomColor: activeDoc.visual.style === "classic-traditional" ? activeDoc.visual.color : undefined
                          }}
                        >
                          <span>{activeDoc.title}</span>
                          <span 
                            className={currentStyles.badge}
                            style={{
                              backgroundColor: activeDoc.visual.style === "ludic-childish" || activeDoc.visual.style === "minimalist"
                                ? activeDoc.visual.color
                                : activeDoc.visual.style === "modern-professional"
                                ? `${activeDoc.visual.color}15`
                                : "transparent",
                              color: activeDoc.visual.style === "classic-traditional" || activeDoc.visual.style === "modern-professional"
                                ? activeDoc.visual.color
                                : "#ffffff",
                              borderColor: activeDoc.visual.style === "classic-traditional"
                                ? activeDoc.visual.color
                                : activeDoc.visual.style === "modern-professional"
                                ? `${activeDoc.visual.color}40`
                                : undefined,
                              boxShadow: activeDoc.visual.style === "ludic-childish"
                                ? `0 0 0 2px ${activeDoc.visual.color}80`
                                : undefined
                            }}
                          >
                            {activeDoc.config.grade.split(" ")[0]} ANO
                          </span>
                          <Edit2 className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition no-print" />
                        </div>
                      )}
                    </div>

                    {/* SHOW ACTIVE PREVIEW SHEET MODE */}
                    {activeSheetTab === "preview" && (
                      <div className="space-y-6">
                        
                        {/* Reading Passage Text block (if enabled) */}
                        {activeDoc.readingPassage && (
                          <div 
                            className={currentStyles.passageBox}
                            style={{
                              borderColor: activeDoc.visual.style === "ludic-childish" || activeDoc.visual.style === "classic-traditional"
                                ? activeDoc.visual.color
                                : undefined,
                              borderLeftColor: activeDoc.visual.style === "minimalist" || activeDoc.visual.style === "modern-professional"
                                ? activeDoc.visual.color
                                : undefined
                            }}
                          >
                            <div className="absolute top-2 right-3 no-print flex gap-2">
                              <button 
                                onClick={() => {
                                  setActiveImagePicker({ type: "passage" });
                                  setCustomImageQuery(activeDoc.readingPassage?.title || "");
                                }}
                                className="p-1 px-2 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded font-bold transition flex items-center gap-1"
                                title="Adicionar ou alterar imagem para o texto"
                              >
                                <Image className="w-3 h-3 text-indigo-600" /> Ilustração
                              </button>
                              <button 
                                onClick={() => setEditingField({ type: "passage-title" })}
                                className="p-1 px-2 text-[10px] bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded font-bold transition flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" /> Título
                              </button>
                              <button 
                                onClick={() => setEditingField({ type: "passage-text" })}
                                className="p-1 px-2 text-[10px] bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded font-bold transition flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" /> Texto
                              </button>
                            </div>

                            {activeDoc.readingPassage ? (
                              <>
                                {editingField?.type === "passage-title" ? (
                                  <div className="mb-2">
                                    <InlineEditInput
                                      value={activeDoc.readingPassage.title}
                                      onSave={saveFieldEdit}
                                      onCancel={() => setEditingField(null)}
                                      className="border-b border-indigo-500 outline-none text-base font-extrabold w-full"
                                    />
                                  </div>
                                ) : (
                                  <h3 
                                    onClick={() => setEditingField({ type: "passage-title" })}
                                    className="text-base font-extrabold mb-2 underline underline-offset-4 decoration-amber-400 leading-tight cursor-pointer hover:bg-neutral-50 rounded p-1"
                                    title="Clique para editar título do texto"
                                  >
                                    {activeDoc.readingPassage.title}
                                  </h3>
                                )}

                                {activeDoc.readingPassage.imageUrl && (
                                  <div className="my-4 flex flex-col items-center justify-center gap-1.5">
                                    <div className="relative group/img max-w-sm rounded-xl overflow-hidden border border-slate-200/60 shadow-md">
                                      <img 
                                        src={activeDoc.readingPassage.imageUrl} 
                                        alt={activeDoc.readingPassage.imagePrompt || "Ilustração do texto"} 
                                        className="w-full object-cover max-h-56"
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveImagePicker({ type: "passage" });
                                          setCustomImageQuery(activeDoc.readingPassage?.title || "");
                                        }}
                                        className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1.5 text-white font-bold text-xs"
                                      >
                                        <Image className="w-4 h-4" /> Alterar Ilustração
                                      </button>
                                    </div>
                                    {activeDoc.readingPassage.imagePrompt && (
                                      <span className="text-[10px] text-neutral-500 italic block font-mono">
                                        Figura 1: {activeDoc.readingPassage.imagePrompt}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {editingField?.type === "passage-text" ? (
                                  <div className="mb-2">
                                    <InlineEditTextarea
                                      value={activeDoc.readingPassage.text}
                                      onSave={saveFieldEdit}
                                      onCancel={() => setEditingField(null)}
                                      className="w-full text-sm leading-relaxed text-neutral-800 font-serif bg-neutral-50 p-2.5 rounded border border-indigo-400 outline-none"
                                      rows={6}
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => setEditingField({ type: "passage-text" })}
                                    className="text-sm whitespace-pre-wrap leading-relaxed text-neutral-800 indent-6 font-serif cursor-pointer hover:bg-neutral-100/50 rounded p-1 transition"
                                    title="Clique para editar texto de leitura"
                                  >
                                    {activeDoc.readingPassage.text}
                                  </div>
                                )}

                                {activeDoc.readingPassage.source && (
                                  <div className="text-[11px] text-right mt-3 text-neutral-500 italic block">
                                    Fonte / Referência: {activeDoc.readingPassage.source}
                                  </div>
                                )}
                              </>
                            ) : null}
                          </div>
                        )}

                        {/* Text indicating beginning of questions */}
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1 mb-4 flex items-center justify-between">
                          <span>Questões Principais</span>
                          <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{activeDoc.questions.length} itens</span>
                        </div>

                        {/* Questions index */}
                        <div className="space-y-8">
                          {activeDoc.questions.length === 0 ? (
                            <div className="no-print p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                              <div className="text-sm font-bold">Nenhuma questão inserida ainda</div>
                              <div className="text-xs">Insira questões pelo Banco de Questões ou clique em Gerar IA!</div>
                            </div>
                          ) : (
                            activeDoc.questions.map((q, qIdx) => (
                              <div key={q.id} className="relative group/idx">
                                
                                {/* Hover floating controls (Only visible during UI sandbox) */}
                                <div className="no-print absolute -right-4 -top-8 hidden group-hover/idx:flex items-center gap-1 bg-slate-900 text-white rounded-lg shadow-xl p-1 z-10 transition animate-in fade-in slide-in-from-top-1">
                                  <button
                                    onClick={() => {
                                      setActiveImagePicker({ type: "question", id: q.id });
                                      setCustomImageQuery(q.prompt.substring(0, 30));
                                    }}
                                    className="p-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-white hover:bg-slate-800 rounded transition flex items-center gap-1 px-2"
                                    title="Gerar ou buscar ilustração para esta questão"
                                  >
                                    <Image className="w-3 h-3 text-indigo-400" /> Ilustração
                                  </button>
                                  <button
                                    onClick={() => setEditingField({ type: "question-prompt", id: q.id })}
                                    className="p-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-white hover:bg-slate-800 rounded transition flex items-center gap-1 px-2"
                                  >
                                    <Edit2 className="w-3 h-3" /> Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="p-1 text-red-400 hover:text-red-100 hover:bg-red-950 rounded transition"
                                    title="Remover questao"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-start gap-3">
                                  
                                  {/* Distinctive style question badge */}
                                  <div 
                                    className={`${currentStyles.questionNumber} shrink-0 mt-0.5`}
                                    style={{
                                      backgroundColor: activeDoc.visual.style === "ludic-childish" || activeDoc.visual.style === "minimalist"
                                        ? activeDoc.visual.color
                                        : activeDoc.visual.style === "modern-professional"
                                        ? `${activeDoc.visual.color}15`
                                        : "transparent",
                                      color: activeDoc.visual.style === "classic-traditional" || activeDoc.visual.style === "modern-professional"
                                        ? activeDoc.visual.color
                                        : "#ffffff",
                                      borderColor: activeDoc.visual.style === "classic-traditional"
                                        ? activeDoc.visual.color
                                        : undefined
                                    }}
                                  >
                                    {qIdx + 1}
                                  </div>

                                  <div className="flex-1 space-y-3">
                                    
                                    {/* Question prompt text */}
                                    {editingField?.type === "question-prompt" && editingField.id === q.id ? (
                                      <div className="space-y-2">
                                        <InlineEditTextarea
                                          value={q.prompt}
                                          onSave={saveFieldEdit}
                                          onCancel={() => setEditingField(null)}
                                          className="w-full text-sm font-semibold text-neutral-800 bg-neutral-50 p-2.5 rounded border border-indigo-400 outline-none focus:ring-1 focus:ring-indigo-500"
                                          rows={3}
                                        />
                                        <div className="flex justify-end gap-1.5 no-print">
                                          <button onClick={() => setEditingField(null)} className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-1 rounded">Cancelar</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p 
                                        onClick={() => setEditingField({ type: "question-prompt", id: q.id })}
                                        className="text-[13.5px] font-semibold text-neutral-850 hover:bg-neutral-50 px-1 py-0.5 rounded cursor-pointer transition leading-snug"
                                        title="Clique para editar enunciado"
                                      >
                                        {q.prompt}
                                      </p>
                                    )}

                                    {/* Question Image/Illustration */}
                                    {q.imageUrl && (
                                      <div className="my-3 max-w-xs rounded-xl overflow-hidden border border-slate-200/50 shadow-sm relative group/qimg">
                                        <img 
                                          src={q.imageUrl} 
                                          alt={q.imagePrompt || "Ilustração de apoio"} 
                                          className="w-full object-cover max-h-48"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover/qimg:opacity-100 transition flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveImagePicker({ type: "question", id: q.id });
                                              setCustomImageQuery(q.prompt.substring(0, 30));
                                            }}
                                            className="px-2 py-1 text-[10px] bg-white text-indigo-800 font-bold rounded-lg hover:bg-indigo-50 transition"
                                          >
                                            Alterar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveImage("question", q.id)}
                                            className="px-2 py-1 text-[10px] bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition"
                                          >
                                            Remover
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Options (Multiple choice list options format / True False) */}
                                    {q.type === "multiple-choice" && q.options && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1.5">
                                        {q.options.map((opt, oIdx) => {
                                          const optionLetter = String.fromCharCode(65 + oIdx);
                                          const isCorrect = q.correctAnswer === optionLetter;
                                          return (
                                            <div 
                                              key={oIdx} 
                                              className={`flex items-start gap-2 text-[12.5px] p-2.5 rounded-lg border transition ${
                                                isCorrect && activeDoc.pages.gabarito
                                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-medium"
                                                  : "border-neutral-100 bg-neutral-50/50 text-neutral-700"
                                              }`}
                                            >
                                              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                isCorrect && activeDoc.pages.gabarito
                                                  ? "bg-emerald-500 text-white"
                                                  : "bg-white text-neutral-500 border border-neutral-200 shadow-sm"
                                              }`}>
                                                {optionLetter}
                                              </span>
                                              <span className="leading-tight">{opt}</span>
                                              {isCorrect && activeDoc.pages.gabarito && (
                                                <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto shrink-0 self-center" />
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* True or False questions representation */}
                                    {q.type === "true-false" && q.options && (
                                      <div className="space-y-2 pl-1.5">
                                        {q.options.map((opt, oIdx) => {
                                          return (
                                            <div 
                                              key={oIdx} 
                                              className="flex items-start gap-2.5 text-[12.5px] p-2 bg-neutral-50/50 rounded-lg border border-neutral-100"
                                            >
                                              <div className="flex gap-1 shrink-0 font-bold text-neutral-400 no-print">
                                                <span className="bg-white border text-[10px] px-1.5 py-0.5 rounded text-neutral-600 hover:text-indigo-600 cursor-pointer">( V )</span>
                                                <span className="bg-white border text-[10px] px-1.5 py-0.5 rounded text-neutral-600 hover:text-indigo-600 cursor-pointer">( F )</span>
                                              </div>
                                              <div className="leading-tight text-neutral-700">______ {opt}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Essay Answer Line indicators mapping */}
                                    {q.type === "essay" && (
                                      <div className="space-y-2 pt-1.5 pl-1">
                                        {activeDoc.pages.linesForEssay ? (
                                          <div className="space-y-4">
                                            <div className="border-b border-dashed border-neutral-300 h-1.5 w-full"></div>
                                            <div className="border-b border-dashed border-neutral-300 h-1.5 w-full"></div>
                                            <div className="border-b border-dashed border-neutral-300 h-1.5 w-full"></div>
                                          </div>
                                        ) : (
                                          <div className="h-16 bg-neutral-50/30 border border-dashed border-neutral-200 rounded-lg flex items-center justify-center text-xs text-neutral-400 font-mono italic">
                                            [ Espaço reservado para resposta do aluno ]
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer indicators inside preview A4 page */}
                        {activeDoc.pages.footerPage && (
                          <div className="border-t border-neutral-100 pt-5 mt-12 flex justify-between items-center text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                            <span>EduMaker - Avaliações Inteligentes</span>
                            <span>Página 1 de 1</span>
                          </div>
                        )}

                      </div>
                    )}

                    {/* SHOW QUESTIONS STRUCTURED EDITING MODE LIST */}
                    {activeSheetTab === "questions" && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Editor de Estrutura Rápido</h4>
                          <p className="text-[11px] text-slate-500 mb-4">Adicione, edite ou remova as questões de forma direta pelo painel.</p>
                          
                          <div className="space-y-4">
                            {activeDoc.questions.map((q, idx) => (
                              <div key={q.id} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                                    Questão {idx + 1} ({q.type})
                                  </span>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remover</span>
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Enunciado / Pergunta</label>
                                  <textarea
                                    value={q.prompt}
                                    onChange={(e) => {
                                      const promptVal = e.target.value;
                                      const updated = {
                                        ...activeDoc,
                                        questions: activeDoc.questions.map(item => item.id === q.id ? { ...item, prompt: promptVal } : item)
                                      };
                                      setActiveDoc(updated);
                                      setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
                                    }}
                                    className="w-full text-xs border rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                                    rows={2}
                                  />
                                </div>

                                {q.type === "multiple-choice" && q.options && (
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 block">Alternativas (Editar Texto)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}</span>
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const optVal = e.target.value;
                                              const updatedOptions = [...(q.options || [])];
                                              updatedOptions[oIdx] = optVal;
                                              const updated = {
                                                ...activeDoc,
                                                questions: activeDoc.questions.map(item => item.id === q.id ? { ...item, options: updatedOptions } : item)
                                              };
                                              setActiveDoc(updated);
                                              setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
                                            }}
                                            className="w-full text-[11px] border rounded px-1.5 py-1 focus:ring-1 focus:ring-indigo-500"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                      <span className="text-[10px] text-slate-500 font-bold">Alternativa Correta (Gabarito):</span>
                                      <select
                                        value={q.correctAnswer}
                                        onChange={(e) => {
                                          const ansVal = e.target.value;
                                          const updated = {
                                            ...activeDoc,
                                            questions: activeDoc.questions.map(item => item.id === q.id ? { ...item, correctAnswer: ansVal } : item)
                                          };
                                          setActiveDoc(updated);
                                          setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
                                          triggerToast("Alternativa de gabarito modificada!");
                                        }}
                                        className="text-xs bg-white border rounded p-1"
                                      >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SHOW DEDICATED COGNITIVE GABARITO OFICIAL MODE */}
                    {activeSheetTab === "gabarito" && (
                      <div className="space-y-6">
                        <div className="border-b-2 border-red-200 pb-2 mb-4 flex items-center justify-between">
                          <h4 className="text-base font-extrabold text-red-600 uppercase tracking-tight flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-red-500" />
                            <span>Gabarito do Aplicador / Respostas Oficiais</span>
                          </h4>
                          <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 font-mono px-3 py-1 rounded">EXCLUSIVO PROFESSOR</span>
                        </div>

                        {/* List correct answers with feedback */}
                        <div className="space-y-6">
                          {activeDoc.questions.map((q, idx) => (
                            <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                              <div className="text-xs font-extrabold text-neutral-800 mb-2">Questão {idx + 1}</div>
                              <p className="text-xs text-neutral-600 mb-3 italic">"{q.prompt}"</p>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-500">Gabarito:</span>
                                <span className="bg-emerald-500 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-md">
                                  {q.correctAnswer}
                                </span>
                              </div>

                              <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-100 leading-relaxed font-mono">
                                <span className="font-extrabold text-indigo-700 text-[10px] block uppercase mb-1">Diretriz Pedagógica &amp; Justificativa:</span>
                                {q.explanation}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Teacher's applied notes section */}
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 border-dashed space-y-2">
                          <span className="text-xs font-extrabold text-amber-800 block uppercase">Anotações do Plano de Aula</span>
                          {editingField?.type === "gabarito-notes" ? (
                            <InlineEditTextarea
                              value={activeDoc.gabaritoNotes || ""}
                              onSave={saveFieldEdit}
                              onCancel={() => setEditingField(null)}
                              className="w-full text-xs font-mono p-3 bg-white rounded border border-amber-300 outline-none"
                              rows={4}
                            />
                          ) : (
                            <p 
                              onClick={() => setEditingField({ type: "gabarito-notes" })}
                              className="text-xs text-amber-950 font-mono whitespace-pre-wrap cursor-pointer hover:bg-amber-100 p-2 rounded transition"
                              title="Clique para editar notas do aplicador"
                            >
                              {activeDoc.gabaritoNotes || "Clique aqui para escrever anotações ou observações específicas de planejamento de aula para este exame."}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  </div>

                </div>

              </div>

              {/* RIGHT SIDE MODEL THEMES & QUICK ACTIONS PANEL */}
              <div className="no-print w-full lg:w-80 bg-white border-l border-slate-200 shrink-0 p-5 overflow-y-auto space-y-6 block">
                
                {/* Style model title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[#374151] font-extrabold text-xs uppercase tracking-wider">Modelo Visual / Estilo</span>
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                </div>

                {/* Theme presets grid */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Escolha o Tema do Layout</label>
                  <div className="grid grid-cols-2 gap-2">
                    
                    <button
                      onClick={() => updateDocStyle("modern-professional")}
                      className={`p-3 rounded-xl border text-left transition ${
                        activeDoc.visual.style === "modern-professional" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-[11px] text-slate-800 block">Moderno Profissional</div>
                      <span className="text-[9px] text-slate-400">Canva &amp; Notion</span>
                    </button>

                    <button
                      onClick={() => updateDocStyle("ludic-childish")}
                      className={`p-3 rounded-xl border text-left transition ${
                        activeDoc.visual.style === "ludic-childish" ? "border-amber-500 bg-amber-50/50" : "border-slate-200 hover:border-amber-400 bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-[11px] text-slate-800 block">Lúdico Infantil</div>
                      <span className="text-[9px] text-slate-400 font-outfit text-amber-600">Primários / Soft</span>
                    </button>

                    <button
                      onClick={() => updateDocStyle("minimalist")}
                      className={`p-3 rounded-xl border text-left transition ${
                        activeDoc.visual.style === "minimalist" ? "border-neutral-900 bg-neutral-100" : "border-slate-200 hover:border-neutral-400 bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-[11px] text-neutral-800 block font-mono">Minimalista</div>
                      <span className="text-[9px] text-neutral-400">Pure whitespace</span>
                    </button>

                    <button
                      onClick={() => updateDocStyle("classic-traditional")}
                      className={`p-3 rounded-xl border text-left transition ${
                        activeDoc.visual.style === "classic-traditional" ? "border-neutral-800 bg-neutral-50" : "border-slate-200 hover:border-neutral-400 bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-[11px] text-slate-800 block font-serif">Clássico</div>
                      <span className="text-[9px] text-slate-400 italic">Academic serif</span>
                    </button>

                  </div>
                </div>

                {/* Color palettes bubbles */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Paleta de Cores do Layout</label>
                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    {[
                      { name: "Verde", hex: "#10B981" },
                      { name: "Azul", hex: "#3B82F6" },
                      { name: "Indigo", hex: "#4F46E5" },
                      { name: "Roxo", hex: "#8B5CF6" },
                      { name: "Laranja", hex: "#F59E0B" },
                      { name: "Pink", hex: "#EC4899" },
                      { name: "Dark", hex: "#111827" }
                    ].map((col, cidx) => (
                      <button
                        key={cidx}
                        onClick={() => updateDocColor(col.hex)}
                        title={col.name}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          activeDoc.visual.color === col.hex ? "scale-110 border-slate-700 ring-2 ring-indigo-200" : "border-transparent"
                        }`}
                        style={{ backgroundColor: col.hex }}
                      />
                    ))}

                    {/* Custom Color Picker with Plus Sign */}
                    <label
                      title="Outra cor..."
                      className={`relative w-7 h-7 rounded-full border border-dashed flex items-center justify-center transition hover:border-indigo-400 cursor-pointer bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 ${
                        ![
                          "#10B981",
                          "#3B82F6",
                          "#4F46E5",
                          "#8B5CF6",
                          "#F59E0B",
                          "#EC4899",
                          "#111827"
                        ].includes(activeDoc.visual.color)
                          ? "scale-110 border-indigo-500 ring-2 ring-indigo-100"
                          : "border-slate-300"
                      }`}
                      style={{
                        backgroundColor: ![
                          "#10B981",
                          "#3B82F6",
                          "#4F46E5",
                          "#8B5CF6",
                          "#F59E0B",
                          "#EC4899",
                          "#111827"
                        ].includes(activeDoc.visual.color)
                          ? activeDoc.visual.color
                          : undefined,
                        color: ![
                          "#10B981",
                          "#3B82F6",
                          "#4F46E5",
                          "#8B5CF6",
                          "#F59E0B",
                          "#EC4899",
                          "#111827"
                        ].includes(activeDoc.visual.color)
                          ? "#ffffff"
                          : undefined
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <input
                        type="color"
                        value={activeDoc.visual.color}
                        onChange={(e) => updateDocColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Selecione uma cor customizada..."
                      />
                    </label>
                  </div>
                </div>

                {/* Typography font changer */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Fontes Tipográficas</label>
                  <select
                    value={activeDoc.visual.fontFamily}
                    onChange={(e) => updateDocFont(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Inter">Inter (Padrão Moderno)</option>
                    <option value="Outfit">Outfit (Estilo Startup)</option>
                    <option value="Space Grotesk">Space Grotesk (Corporativo)</option>
                    <option value="Playfair Display">Playfair Display (Serifa Acadêmica)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Sistemas)</option>
                  </select>
                </div>

                {/* Page Structure adjustments Switches */}
                <div className="space-y-3.5 border-t border-slate-100 pt-5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Opções de Visualização da Página</label>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-medium">Cabeçalho Escolar</span>
                      <input
                        type="checkbox"
                        checked={activeDoc.pages.schoolHeader}
                        onChange={() => togglePageOption("schoolHeader")}
                        className="rounded accent-indigo-600 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-medium">Rodapé com Numeração</span>
                      <input
                        type="checkbox"
                        checked={activeDoc.pages.footerPage}
                        onChange={() => togglePageOption("footerPage")}
                        className="rounded accent-indigo-600 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-medium">Imprimir Gabarito</span>
                      <input
                        type="checkbox"
                        checked={activeDoc.pages.gabarito}
                        onChange={() => togglePageOption("gabarito")}
                        className="rounded accent-indigo-600 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-medium">Espaço Adicional por Item</span>
                      <input
                        type="checkbox"
                        checked={activeDoc.pages.spaceForAnswers}
                        onChange={() => togglePageOption("spaceForAnswers")}
                        className="rounded accent-indigo-600 h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-medium">Linhas Pautadas para Dissertativas</span>
                      <input
                        type="checkbox"
                        checked={activeDoc.pages.linesForEssay}
                        onChange={() => togglePageOption("linesForEssay")}
                        className="rounded accent-indigo-600 h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                {/* Export CTA action buttons */}
                <div className="space-y-2 border-t border-slate-100 pt-5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Exportar / Imprimir</span>
                  
                  {/* Export format triggers */}
                  <button
                    onClick={handleExportWord}
                    className="w-full text-xs font-bold bg-[#2B579A] hover:bg-[#1E3E6E] text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <FileText className="w-4 h-4 text-sky-200" />
                    <span>Baixar em formato Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleTriggerPrint}
                    className="w-full text-xs font-bold bg-[#D32F2F] hover:bg-[#9A0F0F] text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Download className="w-4 h-4 text-red-200" />
                    <span>Salvar em PDF / Imprimir</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSheetTab("gabarito");
                      triggerToast("Gabarito gerado no centro do painel de visualização!");
                    }}
                    className="w-full text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 py-2 rounded-xl text-center shadow-sm transition inline-block block"
                  >
                    Gerar Gabarito Descritivo
                  </button>
                </div>

                {/* Share settings */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Compartilhar com colegas</span>
                  <button
                    onClick={handleCopyShareLink}
                    className="w-full text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Gerar link compartilhável</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: TEACHER DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
              
              {/* Stats highlights */}
              <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Seu Dashboard Pedagógico</h2>
                  <p className="text-xs text-slate-500">Gestão global de turmas e créditos educacionais do EduMaker.</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-white border rounded px-3 py-1.5 font-bold">Última conexão: Hoje, 22:26</span>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold">Plano: EduMaker Escola</span>
                </div>
              </div>

              {/* Stats numbers values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <div className="text-xs text-slate-400 font-bold uppercase">Atividades Criadas</div>
                  <div className="text-3xl font-black text-indigo-600">{activities.length}</div>
                  <div className="text-[10px] text-slate-500">Mais de 10 turmas atendidas corporativamente</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <div className="text-xs text-slate-400 font-bold uppercase font-mono">Total de Questões</div>
                  <div className="text-3xl font-black text-slate-800">
                    {activities.reduce((sum, act) => sum + act.questions.length, 0)}
                  </div>
                  <div className="text-[10px] text-slate-550">Banco curricular individual customizado</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <div className="text-xs text-slate-400 font-bold uppercase">Escolas Atendidas</div>
                  <div className="text-3xl font-black text-emerald-600">3</div>
                  <div className="text-[10px] text-slate-500">Rede de ensino público e privado</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <div className="text-xs text-slate-400 font-bold uppercase">Tempo Médio Salvo</div>
                  <div className="text-3xl font-black text-amber-500">22 hrs</div>
                  <div className="text-[10px] text-slate-500">Oito vezes mais ágil que digitação manual</div>
                </div>
              </div>

              {/* Template quick templates pick category */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Modelos Disponíveis Prontos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRE_BAKED_ACTIVITIES.map((act) => (
                    <div 
                      key={act.id} 
                      className="bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer space-y-3"
                      onClick={() => {
                        setActiveDoc(act);
                        setActiveTab("gerador");
                        triggerToast(`Modelo de ${act.config.subject} carregado no centro!`);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {act.config.subject}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-slate-850 truncate">{act.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{act.readingPassage?.text || 'Sem texto base'}</p>
                      </div>
                      <div className="text-[10px] text-indigo-500 font-bold">Utilizar este template base</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Perks Call-out banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                  <h4 className="text-lg font-black tracking-tight">Precisa de suporte integrado da BNCC?</h4>
                  <p className="text-xs text-slate-400 max-w-xl">Todos os nossos códigos de atividades geradas por inteligência artificial são mapeados 1:1 com os códigos de objetivos oficiais da Base Nacional Comum Curricular.</p>
                </div>
                <button
                  onClick={() => triggerToast("Você já possui acesso Premium completo do EduMaker!")}
                  className="bg-white text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-xl block shrink-0 hover:bg-indigo-50 shadow-lg"
                >
                  Verificar Vantagens Licenciadas
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: MINHAS ATIVIDADES (LIST) */}
          {activeTab === "minhas-atividades" && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Seu Portfólio de Atividades ({activities.length})</h2>
                  <p className="text-xs text-slate-500">Histórico completo de provas e folhas de estudo guardadas nesta máquina.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg w-72">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou assunto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-xs bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>

              {/* History index table grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                    <p className="font-bold text-xs">Nenhuma atividade encontrada</p>
                    <p className="text-[10px]">Tente alterar ou limpar os termos da busca.</p>
                  </div>
                ) : (
                  filteredActivities.map((act) => (
                    <div key={act.id} className="bg-white border text-left p-4 rounded-2xl hover:shadow-md transition flex flex-col justify-between gap-4">
                      
                      {/* Top content brief */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">
                            {act.config.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(act.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-slate-800 truncate">{act.title}</h4>
                          <p className="text-[11px] text-slate-500">Subtítulo: {act.config.theme} | {act.questions.length} questões cadastradas.</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setActiveDoc(act);
                            setActiveSheetTab("preview");
                            setActiveTab("gerador");
                            triggerToast("Documento pronto para edição no painel!");
                          }}
                          className="text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:text-indigo-850"
                        >
                          Visualizar &amp; Editar
                        </button>

                        <button
                          onClick={() => {
                            setActiveDoc(act);
                            handleExportWord();
                          }}
                          className="text-[11px] text-slate-600 hover:text-slate-800 hover:bg-slate-50 border px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                          title="Word Export"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span>Word</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm("Deseja apagar esta atividade permanentemente?")) {
                              setActivities(prev => prev.filter(item => item.id !== act.id));
                              triggerToast("Atividade removida permanentemente!");
                            }
                          }}
                          className="text-[11px] text-red-500 hover:bg-red-50 p-1.5 rounded-lg ml-auto"
                          title="Apagar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  )))}
              </div>

            </div>
          )}

          {/* TAB 5: SYSTEM CONFIGURATION */}
          {activeTab === "configuracoes" && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-2xl mx-auto w-full">
              
              <div className="border-b pb-4">
                <h2 className="text-xl font-extrabold text-slate-800">Preferências do Sistema</h2>
                <p className="text-xs text-slate-500">Ajuste as preferências globais da instituição, dados do docente e exibições inteligentes.</p>
              </div>

              {/* Section 1: School settings details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b pb-1">Perfil da Unidade Escolar</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold">Nome da Instituição</label>
                    <input
                      type="text"
                      value={schoolProfile.name}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold">Segmento de Atuação</label>
                    <input
                      type="text"
                      value={schoolProfile.segment}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, segment: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold">Estilo de Brasão / Logo Padrão</label>
                  <select
                    value={schoolProfile.logoType}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, logoType: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="shield">Escudo Clássico / Brasão</option>
                    <option value="book">Livro Aberto Pedagógico</option>
                    <option value="star">Estrela de Reconhecimento</option>
                    <option value="circle">Design Circular Moderno</option>
                  </select>
                </div>
              </div>

              {/* Section 2: EduMaker Assistant Settings */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>Assistente de Criação Premium</span>
                </h3>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-bold block">Status de Geração</label>
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-emerald-50 text-slate-800 text-xs rounded-xl space-y-1.5 leading-normal border border-indigo-100 relative">
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1.5 text-xs">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>EduMaker AI Inteligente Ativa</span>
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      O assistente pedagógico de alta performance está ativo para criar textos de apoio calibrados, enunciados autorais de avaliações, justificativas pedagógicas e gabaritos comentados com base nas diretrizes curriculares nacionais.
                    </p>
                    <p className="text-[10px] text-slate-400 italic">Processamento na nuvem seguro, sem qualquer necessidade de configuração técnica.</p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-xs text-slate-600 font-bold block">Nome do Professor Docente</span>
                  <input
                    type="text"
                    value={teacherProfile.name}
                    onChange={(e) => {
                      setTeacherProfile({ ...teacherProfile, name: e.target.value });
                      setActiveDoc(prev => ({ ...prev, teacherName: e.target.value }));
                    }}
                    className="w-full text-xs p-2 bg-slate-50 border rounded-lg"
                    placeholder="Prof. Pedro"
                  />
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => {
                      triggerToast("Preferências de configurações salvas e aplicadas!");
                      setActiveTab("gerador");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition"
                  >
                    Salvar e Voltar
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODAL CONFIG ALTERAR UNIDADE ESCOLAR ACTIVE */}
      {showSchoolModal && (
        <div className="no-print fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-indigo-700 font-black">
              <School className="w-5 h-5" />
              <h4 className="text-sm">Configurar Escola Ativa</h4>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold block">Nome da Escola</label>
                <input
                  type="text"
                  value={schoolProfile.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSchoolProfile(prev => ({ ...prev, name: value }));
                    setActiveDoc(prev => ({ ...prev, schoolName: value }));
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold block">Segmento Escolar</label>
                <input
                  type="text"
                  value={schoolProfile.segment}
                  onChange={(e) => setSchoolProfile(prev => ({ ...prev, segment: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowSchoolModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PICKER AND GENERATION MODAL */}
      {activeImagePicker && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xl w-full border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Ilustração Inteligente da Atividade</h4>
                  <p className="text-[10px] text-slate-500">Adicione imagens de apoio para contextualizar o conteúdo didático</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveImagePicker(null);
                  setCustomImageQuery("");
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dynamic suggestion cards based on context */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Palavras-chave Educativas sugeridas</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5 animate-in fade-in zoom-in duration-300">
                  {[
                    "ciencias", "geografia", "historia", "mapa", "natureza",
                    "sistema solar", "química", "leitura", "animais", "dinossauro",
                    "matemática", "geometria", "robo", "computador"
                  ].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setCustomImageQuery(kw)}
                      className="text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg transition"
                    >
                      +{kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyword entry search block */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Qual o tema ou assunto da ilustração?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: celula animal, floresta, imperio romano, fracoes..."
                    value={customImageQuery}
                    onChange={(e) => setCustomImageQuery(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const query = customImageQuery.trim() || activeDoc.config.theme || "education";
                      const generatedUrl = `https://images.unsplash.com/featured/500x350?education,school,${encodeURIComponent(query)}`;
                      handleUpdateImage(
                        activeImagePicker.type, 
                        generatedUrl, 
                        query, 
                        activeImagePicker.id
                      );
                      setActiveImagePicker(null);
                      setCustomImageQuery("");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                    Gerar Ilustração
                  </button>
                </div>
              </div>

              {/* Custom direct URL block */}
              <div className="border-t pt-4 border-slate-100 space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Ou use uma URL direta do Google/Web</label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/imagem-didatica.jpg"
                  onChange={(e) => {
                    const urlVal = e.target.value.trim();
                    if (urlVal.startsWith("http")) {
                      handleUpdateImage(
                        activeImagePicker.type,
                        urlVal,
                        "URL Personalizada",
                        activeImagePicker.id
                      );
                      setActiveImagePicker(null);
                      setCustomImageQuery("");
                    }
                  }}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Sample standard pre-baked packs */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Banco de Ilustrações Escolares</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Experimento", url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=150&q=80" },
                    { label: "Mapas", url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=150&q=80" },
                    { label: "Livros", url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=150&q=80" },
                    { label: "Tecnologia", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80" }
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        handleUpdateImage(
                          activeImagePicker.type,
                          item.url,
                          item.label,
                          activeImagePicker.id
                        );
                        setActiveImagePicker(null);
                        setCustomImageQuery("");
                      }}
                      className="group border border-slate-150 hover:border-indigo-400 rounded-xl overflow-hidden text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition text-center space-y-1 active:scale-95"
                    >
                      <img src={item.url} alt={item.label} className="w-full h-14 object-cover group-hover:opacity-90 grayscale-[20%] group-hover:grayscale-0" referrerPolicy="no-referrer" />
                      <div className="pb-1.5 px-1 truncate">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleRemoveImage(activeImagePicker.type, activeImagePicker.id);
                  setActiveImagePicker(null);
                  setCustomImageQuery("");
                }}
                className="text-red-650 hover:bg-red-50 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                Remover Imagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveImagePicker(null);
                  setCustomImageQuery("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2 rounded-xl transition"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
