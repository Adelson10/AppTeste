/**
 * ============================================================
 * ARQUIVO: App.tsx
 * DESCRIÇÃO: Componente raiz do EduMaker — orquestra todos os
 *            módulos da aplicação e gerencia a navegação entre tabs.
 *
 * Responsabilidades deste arquivo:
 * - Renderizar o layout principal (header, sidebar, área de trabalho)
 * - Conectar os hooks useActivities e useActivityGenerator
 * - Controlar qual tab está ativa e qual modal está aberto
 * - Delegar lógica para os módulos utilitários (export, styles)
 * - Renderizar os 4 painéis de edição: Gerador, Dashboard,
 *   Minhas Atividades e Configurações
 *
 * Estrutura visual:
 * ┌─────────────────────────────────────────────────────┐
 * │ HEADER (logo, busca, status IA, perfil)             │
 * ├──────────┬──────────────────────────┬───────────────┤
 * │ SIDEBAR  │  ÁREA CENTRAL (editor)   │ PAINEL VISUAL │
 * │ (nav)    │  A4 prévia + tabs        │ (temas/export)│
 * └──────────┴──────────────────────────┴───────────────┘
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles, Layers, Sliders, Download, BookOpen, Settings,
  Plus, Search, Share2, FileText, CheckCircle, School,
  Edit2, Trash2, HelpCircle, RefreshCw, SlidersHorizontal,
  ChevronRight, ChevronLeft, Grid, Image, X, CheckSquare,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────────
import { Activity, ActivityConfig, SchoolProfile, TeacherProfile, PageOptions } from "./types";

// ── Hooks ──────────────────────────────────────────────────────────────────────
import { useActivities } from "./hooks/useActivities";
import { useActivityGenerator } from "./hooks/useActivityGenerator";

// ── Componentes ────────────────────────────────────────────────────────────────
import { InlineEditInput, InlineEditTextarea } from "./components/InlineEditors";

// ── Utilitários ────────────────────────────────────────────────────────────────
import { exportToWord } from "./utils/exportWord";
import { getStyleClasses } from "./utils/styleClasses";

// ── Dados estáticos ────────────────────────────────────────────────────────────
import { PRE_BAKED_ACTIVITIES, QUESTION_BANK_TEMPLATES } from "./data/prebaked";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS LOCAIS (internos ao App, não precisam ser exportados)
// ─────────────────────────────────────────────────────────────────────────────

/** Identifica qual campo do documento está sendo editado inline */
type EditingField =
  | { type: "school" }
  | { type: "teacher" }
  | { type: "title" }
  | { type: "passage-title" }
  | { type: "passage-text" }
  | { type: "gabarito-notes" }
  | { type: "question-prompt"; id: number };

/** Identifica qual modal de imagem está aberto e para qual elemento */
type ImagePickerState = { type: "passage"; id?: undefined } | { type: "question"; id: number };

/** Tabs de navegação principal da sidebar */
type MainTab = "gerador" | "dashboard" | "minhas-atividades" | "configuracoes";

/** Sub-tabs da área central do editor de atividade */
type SheetTab = "preview" | "questions" | "gabarito";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {

  // ── ESTADO DE NAVEGAÇÃO ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab]           = useState<MainTab>("gerador");
  const [activeSheetTab, setActiveSheetTab] = useState<SheetTab>("preview");

  // ── ESTADO DE UI ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]             = useState("");
  const [toastMessage, setToastMessage]           = useState<string | null>(null);
  const [showSchoolModal, setShowSchoolModal]     = useState(false);
  const [editingField, setEditingField]           = useState<EditingField | null>(null);
  const [activeImagePicker, setActiveImagePicker] = useState<ImagePickerState | null>(null);
  const [customImageQuery, setCustomImageQuery]   = useState("");
  const [zoomRatio, setZoomRatio]                 = useState(100);
  const [isFullscreen, setIsFullscreen]           = useState(false);
  const [windowWidth, setWindowWidth]             = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // ── ESTADO DE PERFIS ────────────────────────────────────────────────────────
  const [schoolProfile, setSchoolProfile]   = useState<SchoolProfile>({
    name: "COLÉGIO EXEMPLO",
    segment: "Ensino Fundamental II",
    logoType: "shield",
  });

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>({
    name: "Prof. Pedro",
    role: "Professor Pedagogo",
    credits: 1250,
    savedCount: 22,
  });

  // ── PARÂMETROS DE GERAÇÃO ───────────────────────────────────────────────────
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
      passage: true,
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // HOOKS DE NEGÓCIO
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Gerencia todo o estado de atividades: lista, ativo, CRUD, imagens.
   * Recebe searchQuery para manter o filtro reativo à busca do usuário.
   */
  const {
    activities,
    activeDoc,
    filteredActivities,
    setActiveDoc,
    addActivity,
    updateActiveDoc,
    deleteActivity,
    updateDocColor,
    updateDocFont,
    updateDocStyle,
    togglePageOption,
    appendQuestion,
    deleteQuestion,
    updateImage,
    removeImage,
  } = useActivities(searchQuery);

  /**
   * Gerencia a geração de atividades via IA (com fallback local).
   * - onActivityGenerated: recebe a atividade criada e a adiciona ao portfólio
   * - onCreditConsumed: debita 20 créditos do professor por geração
   */
  const { loading, errorInfo, generateActivity } = useActivityGenerator(
    (newActivity) => {
      addActivity(newActivity);
      setActiveTab("gerador");
      triggerToast("Atividade gerada com sucesso!");
    },
    () => setTeacherProfile(prev => ({
      ...prev,
      credits: Math.max(0, prev.credits - 20),
    }))
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // EFEITOS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Rastreia largura da janela para cálculo de zoom responsivo */
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNÇÕES AUXILIARES DE UI
  // ─────────────────────────────────────────────────────────────────────────────

  /** Exibe uma notificação toast por 4 segundos */
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EDIÇÃO INLINE DE CAMPOS DO DOCUMENTO
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Salva a edição inline de um campo do documento ativo.
   * Chamado pelo InlineEditInput e InlineEditTextarea ao confirmar.
   *
   * Mapeia o tipo do campo editado (editingField.type) para a propriedade
   * correta do objeto Activity e aplica o novo valor.
   */
  const saveFieldEdit = (newValue: string) => {
    if (!editingField) return;
    const value = newValue.trim();
    let updated = { ...activeDoc };

    switch (editingField.type) {
      case "school":
        updated.schoolName = value;
        setSchoolProfile(prev => ({ ...prev, name: value }));
        break;
      case "teacher":
        updated.teacherName = value;
        setTeacherProfile(prev => ({ ...prev, name: value }));
        break;
      case "title":
        updated.title = value;
        break;
      case "passage-title":
        if (updated.readingPassage) updated.readingPassage.title = value;
        break;
      case "passage-text":
        if (updated.readingPassage) updated.readingPassage.text = value;
        break;
      case "gabarito-notes":
        updated.gabaritoNotes = value;
        break;
      case "question-prompt":
        updated.questions = updated.questions.map(q =>
          q.id === editingField.id ? { ...q, prompt: value } : q
        );
        break;
    }

    updateActiveDoc(updated);
    setEditingField(null);
    triggerToast("Documento atualizado!");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // AÇÕES DE EXPORTAÇÃO E COMPARTILHAMENTO
  // ─────────────────────────────────────────────────────────────────────────────

  const handleExportWord = () => {
    exportToWord(activeDoc, schoolProfile);
    triggerToast("Exportando para Word (.doc)...");
  };

  const handlePrint = () => window.print();

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast("Link de compartilhamento copiado!");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CÁLCULO DE ZOOM RESPONSIVO
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Calcula o fator de escala final do canvas A4.
   * Em mobile/tablet, reduz proporcionalmente para caber na tela.
   * Em desktop, usa apenas o zoom manual do professor (zoomRatio).
   */
  const isMobileOrTablet = windowWidth < 1024;
  const availableWidth   = isMobileOrTablet ? windowWidth - 32 : 800;
  const responsiveScale  = isMobileOrTablet ? Math.min(1, availableWidth / 800) : 1;
  const finalScale       = (zoomRatio / 100) * responsiveScale;

  // Obtém as classes CSS do tema visual ativo
  const currentStyles = getStyleClasses(activeDoc.visual.style);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div id="edumaker-app" className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-inter">

      {/* ── TOAST DE NOTIFICAÇÃO ─────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[999] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="no-print h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <span className="text-lg font-extrabold tracking-tight text-slate-800">
            Edu<span className="text-indigo-600">Maker</span>
          </span>
          <span className="ml-2 bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
            Premium
          </span>
        </div>

        {/* Barra de busca central */}
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

        {/* Controles do lado direito */}
        <div className="flex items-center gap-4">
          {/* Indicador de status da IA */}
          <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 rounded-xl px-3 py-1.5 hidden sm:flex flex-col text-right">
            <div className="flex items-center justify-end gap-1.5 text-[11px] font-extrabold text-slate-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>EduMaker AI Online</span>
            </div>
            <div className="text-[9px] text-indigo-600/80 font-semibold -mt-0.5">
              ✨ IA Educacional Premium Ativa
            </div>
          </div>

          {/* Botão de preferências */}
          <button
            onClick={() => setActiveTab("configuracoes")}
            className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 border text-slate-600 hover:text-indigo-600 border-slate-200 font-bold px-3 py-2 rounded-xl transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferências</span>
          </button>

          {/* Avatar do professor */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              PP
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-bold text-slate-700">{teacherProfile.name}</div>
              <div className="text-[10px] text-slate-400">{teacherProfile.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CORPO PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row relative">

        {/* ── SIDEBAR DE NAVEGAÇÃO ───────────────────────────────────────── */}
        <aside className="no-print lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-6">

            {/* Botão Nova Atividade */}
            <button
              onClick={() => {
                setActiveTab("gerador");
                triggerToast("Configure os parâmetros para gerar a atividade.");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 text-indigo-200" />
              <span>Nova Atividade</span>
            </button>

            {/* Menu de navegação */}
            <nav className="space-y-1">
              {(
                [
                  { id: "dashboard",          label: "Dashboard",          icon: <Grid className="w-4 h-4" /> },
                  { id: "minhas-atividades",  label: "Minhas Atividades",  icon: <FileText className="w-4 h-4" />, badge: activities.length },
                  { id: "gerador",            label: "Gerador com IA",     icon: <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" /> },
                  { id: "configuracoes",      label: "Configurações",      icon: <Settings className="w-4 h-4" /> },
                ] as const
              ).map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === item.id
                      ? "bg-slate-800 text-white font-bold"
                      : "hover:bg-slate-800/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {"badge" in item && (
                    <span className="ml-auto bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Card da escola ativa */}
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded">
                  <School className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-white truncate">{schoolProfile.name}</div>
                  <div className="text-[10px] text-slate-400">{schoolProfile.segment}</div>
                </div>
              </div>
              <button
                onClick={() => setShowSchoolModal(true)}
                className="w-full text-center text-[10.5px] bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 py-1.5 rounded transition font-medium"
              >
                Alterar escola ativa
              </button>
            </div>
          </div>

          {/* Rodapé da sidebar */}
          <div className="space-y-4 pt-10">
            {/* Widget de créditos */}
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-indigo-300">Créditos Premium</span>
                <span className="text-white">{teacherProfile.credits} restam</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (teacherProfile.credits / 1500) * 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-400 pt-0.5">Renova em 25/06/2026</div>
            </div>
            <div className="text-[10px] text-slate-500 text-center flex flex-col gap-0.5">
              <span>EduMaker SaaS v3.2</span>
              <span>Conforme diretrizes BNCC Brasil</span>
            </div>
          </div>
        </aside>

        {/* ── ÁREA DE TRABALHO PRINCIPAL ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ════════════════════════════════════════════════════════════════
              TAB 1 — GERADOR COM IA (editor principal)
              Layout de 3 colunas: parâmetros | canvas A4 | temas/export
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "gerador" && (
            <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto bg-slate-100">

              {/* ── PAINEL ESQUERDO: Parâmetros de geração ─────────────── */}
              <div className="no-print w-full lg:w-80 bg-white border-r border-slate-200 shrink-0 p-5 overflow-y-auto space-y-5">

                <div className="flex items-center gap-1.5 text-[#374151] font-bold text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>1. Conteúdo da Atividade</span>
                </div>

                {/* Matéria */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Disciplina / Matéria</label>
                  <select
                    value={genConfig.subject}
                    onChange={(e) => setGenConfig({ ...genConfig, subject: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option>Língua Portuguesa</option>
                    <option>Matemática</option>
                    <option>Ciências</option>
                    <option>História</option>
                    <option>Geografia</option>
                    <option>Inglês</option>
                  </select>
                </div>

                {/* Série */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Série / Ano</label>
                  <select
                    value={genConfig.grade}
                    onChange={(e) => setGenConfig({ ...genConfig, grade: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="5º Ano do Ensino Fundamental">5º Ano</option>
                    <option value="6º Ano do Ensino Fundamental">6º Ano</option>
                    <option value="7º Ano do Ensino Fundamental">7º Ano</option>
                    <option value="8º Ano do Ensino Fundamental">8º Ano</option>
                    <option value="9º Ano do Ensino Fundamental">9º Ano</option>
                  </select>
                </div>

                {/* Tema */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Tema Principal</label>
                  <input
                    type="text"
                    value={genConfig.theme}
                    onChange={(e) => setGenConfig({ ...genConfig, theme: e.target.value })}
                    placeholder="Ex: Interpretação de Texto, Frações..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* BNCC */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600">Códigos BNCC</label>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Insira diretrizes normativas BNCC" />
                  </div>
                  <input
                    type="text"
                    value={genConfig.bncc}
                    onChange={(e) => setGenConfig({ ...genConfig, bncc: e.target.value })}
                    placeholder="Ex: EF69LP44, EF06MA07"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Quantidade */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Quantidade de Questões</label>
                  <select
                    value={genConfig.numQuestions}
                    onChange={(e) => setGenConfig({ ...genConfig, numQuestions: parseInt(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {[3, 4, 5, 8, 10].map(n => (
                      <option key={n} value={n}>{n} questões</option>
                    ))}
                  </select>
                </div>

                {/* Tipos de questão */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tipos de Questões</label>
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {(
                      [
                        { key: "multipleChoice", label: "Múltipla Escolha" },
                        { key: "trueFalse",      label: "Verdadeiro ou Falso" },
                        { key: "essay",          label: "Dissertativa" },
                      ] as const
                    ).map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genConfig.questionTypes[key]}
                          onChange={(e) => setGenConfig({
                            ...genConfig,
                            questionTypes: { ...genConfig.questionTypes, [key]: e.target.checked },
                          })}
                          className="rounded accent-indigo-600"
                        />
                        {label}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-xs text-slate-900 font-semibold cursor-pointer border-t border-slate-200 pt-1.5 mt-1.5">
                      <input
                        type="checkbox"
                        checked={genConfig.questionTypes.passage}
                        onChange={(e) => setGenConfig({
                          ...genConfig,
                          questionTypes: { ...genConfig.questionTypes, passage: e.target.checked },
                        })}
                        className="rounded accent-indigo-600"
                      />
                      Incluir Texto Base
                    </label>
                  </div>
                </div>

                {/* Botão de geração */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Banner de erro do fallback (quando IA falha) */}
                  {errorInfo && (
                    <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg">
                      ⚠️ {errorInfo}
                    </div>
                  )}
                  <button
                    onClick={() => generateActivity(genConfig, schoolProfile, teacherProfile)}
                    disabled={loading}
                    className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-[98%] transition disabled:bg-indigo-400"
                  >
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin text-indigo-200" /><span>Gerando com IA...</span></>
                    ) : (
                      <><Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" /><span>Gerar Atividade Completa</span></>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">Usará 20 créditos pedagógicos premium</p>
                </div>
              </div>

              {/* ── CANVAS CENTRAL: Prévia A4 ──────────────────────────── */}
              <div className="flex-1 flex flex-col min-w-0">

                {/* Toolbar da prévia */}
                <div className="no-print h-12 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0">
                  {/* Sub-tabs: Prévia / Questões / Gabarito */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                    {(["preview", "questions", "gabarito"] as SheetTab[]).map((tab) => {
                      const labels: Record<SheetTab, string> = {
                        preview: "Pré-visualização",
                        questions: `Questões (${activeDoc.questions.length})`,
                        gabarito: "Gabarito",
                      };
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveSheetTab(tab)}
                          className={`text-xs px-3 py-1 rounded-md font-bold transition ${
                            activeSheetTab === tab
                              ? "bg-white text-indigo-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Controles de zoom */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">PAGINA-1_A4.doc</span>
                    <div className="flex items-center gap-2 border-l pl-3 border-slate-200">
                      <button onClick={() => setZoomRatio(p => Math.max(50, p - 10))} className="p-1 text-slate-400 hover:text-slate-800 rounded transition">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-600 w-10 text-center">{zoomRatio}%</span>
                      <button onClick={() => setZoomRatio(p => Math.min(180, p + 10))} className="p-1 text-slate-400 hover:text-slate-800 rounded transition">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={`p-1.5 rounded text-xs transition ${isFullscreen ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Área de rolagem do canvas */}
                <div className={`flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start ${isFullscreen ? "fixed inset-0 bg-slate-850 z-50 pt-20" : ""}`}>
                  {/* Wrapper dimensionado pelo zoom */}
                  <div
                    className="scale-wrapper relative shrink-0 transition-all origin-top"
                    style={{ width: `${800 * finalScale}px`, height: `${1123 * finalScale}px`, maxWidth: "100%", margin: "0 auto" }}
                  >
                    {/* Papel A4 */}
                    <div
                      id="worksheet-canvas"
                      className={`printable-area bg-white text-neutral-900 border border-neutral-200/70 p-12 absolute left-0 top-0 origin-top-left min-h-[1123px] w-[800px] shadow-2xl ${currentStyles.font}`}
                      style={{
                        transform: `scale(${finalScale})`,
                        borderColor: activeDoc.visual.style === "ludic-childish" ? activeDoc.visual.color : undefined,
                        borderTopColor: activeDoc.visual.style === "minimalist" ? activeDoc.visual.color : undefined,
                      }}
                    >

                      {/* ── Cabeçalho da escola ─────────────────────────── */}
                      {activeDoc.pages.schoolHeader && (
                        <div
                          className={currentStyles.headerDivider}
                          style={{ borderBottomColor: activeDoc.visual.style !== "ludic-childish" ? activeDoc.visual.color : undefined }}
                        >
                          <div className="flex items-start justify-between">
                            {/* Logo + nome da escola (clicável para editar) */}
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg border flex items-center justify-center cursor-pointer"
                                style={{ backgroundColor: `${activeDoc.visual.color}15`, color: activeDoc.visual.color, borderColor: `${activeDoc.visual.color}35` }}
                              >
                                <School className="w-6 h-6" />
                              </div>
                              <div>
                                {editingField?.type === "school" ? (
                                  <InlineEditInput value={activeDoc.schoolName} onSave={saveFieldEdit} onCancel={() => setEditingField(null)} className="border-b border-indigo-500 outline-none text-base font-extrabold" />
                                ) : (
                                  <div onClick={() => setEditingField({ type: "school" })} className="text-base font-extrabold hover:bg-neutral-50 p-1 rounded cursor-pointer flex items-center gap-1.5">
                                    <span>{activeDoc.schoolName}</span>
                                    <Edit2 className="w-3.5 h-3.5 text-neutral-300 no-print" />
                                  </div>
                                )}
                                <div className="text-[10.5px] text-neutral-500 uppercase font-bold tracking-wider pl-1">{schoolProfile.segment}</div>
                              </div>
                            </div>

                            {/* Campos do aluno */}
                            <div className="bg-neutral-50/50 p-3 rounded-lg border border-neutral-100 text-xs text-neutral-700 font-mono" style={{ width: "700px" }}>
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
                              <div className="mt-1.5 pt-1 border-t border-neutral-200 flex justify-between items-center">
                                <span className="font-bold text-neutral-500 text-[9px] uppercase">Prof: <b>{activeDoc.teacherName}</b></span>
                                <span className="font-bold text-[9px] uppercase">Nota: _______</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Título da atividade ─────────────────────────── */}
                      <div className="my-6">
                        {editingField?.type === "title" ? (
                          <InlineEditInput value={activeDoc.title} onSave={saveFieldEdit} onCancel={() => setEditingField(null)} className="border-b-2 border-indigo-500 outline-none text-xl font-extrabold w-full text-center" />
                        ) : (
                          <div
                            onClick={() => setEditingField({ type: "title" })}
                            className={`group hover:bg-neutral-50 p-2 rounded cursor-pointer ${currentStyles.title} flex items-center justify-center gap-2`}
                            style={{ color: activeDoc.visual.style === "ludic-childish" ? activeDoc.visual.color : undefined }}
                          >
                            <span>{activeDoc.title}</span>
                            <span
                              className={currentStyles.badge}
                              style={{
                                backgroundColor: ["ludic-childish", "minimalist"].includes(activeDoc.visual.style) ? activeDoc.visual.color : `${activeDoc.visual.color}15`,
                                color: ["classic-traditional", "modern-professional"].includes(activeDoc.visual.style) ? activeDoc.visual.color : "#ffffff",
                                borderColor: `${activeDoc.visual.color}40`,
                              }}
                            >
                              {activeDoc.config.grade.split(" ")[0]} ANO
                            </span>
                            <Edit2 className="w-4 h-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition no-print" />
                          </div>
                        )}
                      </div>

                      {/* ══════════════════════════════════════════════════
                          SUB-TAB: PRÉVIA COMPLETA DO DOCUMENTO
                      ══════════════════════════════════════════════════ */}
                      {activeSheetTab === "preview" && (
                        <div className="space-y-6">

                          {/* Texto base de leitura */}
                          {activeDoc.readingPassage && (
                            <div
                              className={`${currentStyles.passageBox} relative`}
                              style={{ borderLeftColor: ["minimalist", "modern-professional"].includes(activeDoc.visual.style) ? activeDoc.visual.color : undefined }}
                            >
                              {/* Botões de edição do texto base */}
                              <div className="absolute top-2 right-3 no-print flex gap-2">
                                <button onClick={() => { setActiveImagePicker({ type: "passage" }); setCustomImageQuery(activeDoc.readingPassage?.title || ""); }} className="p-1 px-2 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded font-bold flex items-center gap-1">
                                  <Image className="w-3 h-3" /> Ilustração
                                </button>
                                <button onClick={() => setEditingField({ type: "passage-title" })} className="p-1 px-2 text-[10px] bg-white text-indigo-700 border border-indigo-200 rounded font-bold flex items-center gap-1">
                                  <Edit2 className="w-3 h-3" /> Título
                                </button>
                                <button onClick={() => setEditingField({ type: "passage-text" })} className="p-1 px-2 text-[10px] bg-white text-indigo-700 border border-indigo-200 rounded font-bold flex items-center gap-1">
                                  <Edit2 className="w-3 h-3" /> Texto
                                </button>
                              </div>

                              {/* Título do texto */}
                              {editingField?.type === "passage-title" ? (
                                <InlineEditInput value={activeDoc.readingPassage.title} onSave={saveFieldEdit} onCancel={() => setEditingField(null)} className="border-b border-indigo-500 outline-none text-base font-extrabold w-full mb-2" />
                              ) : (
                                <h3 onClick={() => setEditingField({ type: "passage-title" })} className="text-base font-extrabold mb-2 underline underline-offset-4 decoration-amber-400 cursor-pointer hover:bg-neutral-50 rounded p-1">
                                  {activeDoc.readingPassage.title}
                                </h3>
                              )}

                              {/* Imagem ilustrativa do texto (se existir) */}
                              {activeDoc.readingPassage.imageUrl && (
                                <div className="my-4 flex flex-col items-center gap-1.5">
                                  <div className="relative group/img max-w-sm rounded-xl overflow-hidden border border-slate-200/60 shadow-md">
                                    <img src={activeDoc.readingPassage.imageUrl} alt={activeDoc.readingPassage.imagePrompt || "Ilustração"} className="w-full object-cover max-h-56" referrerPolicy="no-referrer" />
                                    <button onClick={() => { setActiveImagePicker({ type: "passage" }); setCustomImageQuery(activeDoc.readingPassage?.title || ""); }} className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1.5 text-white font-bold text-xs">
                                      <Image className="w-4 h-4" /> Alterar Ilustração
                                    </button>
                                  </div>
                                  {activeDoc.readingPassage.imagePrompt && (
                                    <span className="text-[10px] text-neutral-500 italic font-mono">Figura 1: {activeDoc.readingPassage.imagePrompt}</span>
                                  )}
                                </div>
                              )}

                              {/* Corpo do texto */}
                              {editingField?.type === "passage-text" ? (
                                <InlineEditTextarea value={activeDoc.readingPassage.text} onSave={saveFieldEdit} onCancel={() => setEditingField(null)} className="w-full text-sm leading-relaxed font-serif bg-neutral-50 p-2.5 rounded border border-indigo-400 outline-none" rows={6} />
                              ) : (
                                <div onClick={() => setEditingField({ type: "passage-text" })} className="text-sm whitespace-pre-wrap leading-relaxed text-neutral-800 indent-6 font-serif cursor-pointer hover:bg-neutral-100/50 rounded p-1">
                                  {activeDoc.readingPassage.text}
                                </div>
                              )}

                              {/* Fonte do texto */}
                              {activeDoc.readingPassage.source && (
                                <div className="text-[11px] text-right mt-3 text-neutral-500 italic">
                                  Fonte: {activeDoc.readingPassage.source}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Separador de questões */}
                          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-1 mb-4 flex items-center justify-between">
                            <span>Questões Principais</span>
                            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{activeDoc.questions.length} itens</span>
                          </div>

                          {/* Lista de questões */}
                          <div className="space-y-8">
                            {activeDoc.questions.length === 0 ? (
                              <div className="no-print p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                                <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                                <div className="text-sm font-bold">Nenhuma questão inserida ainda</div>
                                <div className="text-xs">Clique em "Gerar Atividade" ou adicione pelo banco de questões.</div>
                              </div>
                            ) : (
                              activeDoc.questions.map((q, qIdx) => (
                                <div key={q.id} className="relative group/idx">

                                  {/* Controles flutuantes por questão */}
                                  <div className="no-print absolute -right-4 -top-8 hidden group-hover/idx:flex items-center gap-1 bg-slate-900 text-white rounded-lg shadow-xl p-1 z-10">
                                    <button onClick={() => { setActiveImagePicker({ type: "question", id: q.id }); setCustomImageQuery(q.prompt.substring(0, 30)); }} className="p-1 px-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-1">
                                      <Image className="w-3 h-3" /> Ilustração
                                    </button>
                                    <button onClick={() => setEditingField({ type: "question-prompt", id: q.id })} className="p-1 px-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-white hover:bg-slate-800 rounded flex items-center gap-1">
                                      <Edit2 className="w-3 h-3" /> Editar
                                    </button>
                                    <button onClick={() => deleteQuestion(q.id)} className="p-1 text-red-400 hover:text-red-100 hover:bg-red-950 rounded">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    {/* Número da questão (estilizado pelo tema) */}
                                    <div
                                      className={`${currentStyles.questionNumber} shrink-0 mt-0.5`}
                                      style={{
                                        backgroundColor: ["ludic-childish", "minimalist"].includes(activeDoc.visual.style) ? activeDoc.visual.color : `${activeDoc.visual.color}15`,
                                        color: ["classic-traditional", "modern-professional"].includes(activeDoc.visual.style) ? activeDoc.visual.color : "#ffffff",
                                        borderColor: activeDoc.visual.style === "classic-traditional" ? activeDoc.visual.color : undefined,
                                      }}
                                    >
                                      {qIdx + 1}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                      {/* Enunciado editável */}
                                      {editingField?.type === "question-prompt" && editingField.id === q.id ? (
                                        <InlineEditTextarea value={q.prompt} onSave={saveFieldEdit} onCancel={() => setEditingField(null)} className="w-full text-sm font-semibold bg-neutral-50 p-2.5 rounded border border-indigo-400 outline-none" rows={3} />
                                      ) : (
                                        <p onClick={() => setEditingField({ type: "question-prompt", id: q.id })} className="text-[13.5px] font-semibold text-neutral-850 hover:bg-neutral-50 px-1 py-0.5 rounded cursor-pointer leading-snug">
                                          {q.prompt}
                                        </p>
                                      )}

                                      {/* Imagem da questão */}
                                      {q.imageUrl && (
                                        <div className="my-3 max-w-xs rounded-xl overflow-hidden border border-slate-200/50 shadow-sm relative group/qimg">
                                          <img src={q.imageUrl} alt={q.imagePrompt || "Ilustração"} className="w-full object-cover max-h-48" referrerPolicy="no-referrer" />
                                          <div className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover/qimg:opacity-100 transition flex items-center justify-center gap-1.5">
                                            <button onClick={() => { setActiveImagePicker({ type: "question", id: q.id }); setCustomImageQuery(q.prompt.substring(0, 30)); }} className="px-2 py-1 text-[10px] bg-white text-indigo-800 font-bold rounded-lg">Alterar</button>
                                            <button onClick={() => removeImage("question", q.id)} className="px-2 py-1 text-[10px] bg-red-600 text-white font-bold rounded-lg">Remover</button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Alternativas — Múltipla Escolha */}
                                      {q.type === "multiple-choice" && q.options && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1.5">
                                          {q.options.map((opt, oIdx) => {
                                            const letter = String.fromCharCode(65 + oIdx);
                                            const isCorrect = q.correctAnswer === letter;
                                            return (
                                              <div key={oIdx} className={`flex items-start gap-2 text-[12.5px] p-2.5 rounded-lg border ${isCorrect && activeDoc.pages.gabarito ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-medium" : "border-neutral-100 bg-neutral-50/50 text-neutral-700"}`}>
                                                <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${isCorrect && activeDoc.pages.gabarito ? "bg-emerald-500 text-white" : "bg-white text-neutral-500 border border-neutral-200 shadow-sm"}`}>
                                                  {letter}
                                                </span>
                                                <span className="leading-tight">{opt}</span>
                                                {isCorrect && activeDoc.pages.gabarito && <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto shrink-0 self-center" />}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Alternativas — Verdadeiro ou Falso */}
                                      {q.type === "true-false" && q.options && (
                                        <div className="space-y-2 pl-1.5">
                                          {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-start gap-2.5 text-[12.5px] p-2 bg-neutral-50/50 rounded-lg border border-neutral-100">
                                              <div className="flex gap-1 shrink-0 font-bold no-print">
                                                <span className="bg-white border text-[10px] px-1.5 py-0.5 rounded text-neutral-600">( V )</span>
                                                <span className="bg-white border text-[10px] px-1.5 py-0.5 rounded text-neutral-600">( F )</span>
                                              </div>
                                              <div className="leading-tight text-neutral-700">______ {opt}</div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Linhas para dissertativa */}
                                      {q.type === "essay" && (
                                        <div className="space-y-2 pt-1.5 pl-1">
                                          {activeDoc.pages.linesForEssay ? (
                                            <div className="space-y-4">
                                              {[0, 1, 2].map(i => <div key={i} className="border-b border-dashed border-neutral-300 h-1.5 w-full" />)}
                                            </div>
                                          ) : (
                                            <div className="h-16 bg-neutral-50/30 border border-dashed border-neutral-200 rounded-lg flex items-center justify-center text-xs text-neutral-400 italic">
                                              [ Espaço reservado para resposta ]
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

                          {/* Rodapé do documento */}
                          {activeDoc.pages.footerPage && (
                            <div className="border-t border-neutral-100 pt-5 mt-12 flex justify-between items-center text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                              <span>EduMaker - Avaliações Inteligentes</span>
                              <span>Página 1 de 1</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ══════════════════════════════════════════════════
                          SUB-TAB: EDITOR ESTRUTURADO DE QUESTÕES
                      ══════════════════════════════════════════════════ */}
                      {activeSheetTab === "questions" && (
                        <div className="space-y-6">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Editor de Estrutura Rápido</h4>
                            <p className="text-[11px] text-slate-500 mb-4">Edite enunciados, alternativas e gabarito diretamente.</p>
                            <div className="space-y-4">
                              {activeDoc.questions.map((q, idx) => (
                                <div key={q.id} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                                      Questão {idx + 1} ({q.type})
                                    </span>
                                    <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1">
                                      <Trash2 className="w-3.5 h-3.5" /> Remover
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 block">Enunciado</label>
                                    <textarea
                                      value={q.prompt}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateActiveDoc({
                                          ...activeDoc,
                                          questions: activeDoc.questions.map(item =>
                                            item.id === q.id ? { ...item, prompt: val } : item
                                          ),
                                        });
                                      }}
                                      className="w-full text-xs border rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                                      rows={2}
                                    />
                                  </div>
                                  {q.type === "multiple-choice" && q.options && (
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-slate-500 block">Alternativas</label>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {q.options.map((opt, oIdx) => (
                                          <div key={oIdx} className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}</span>
                                            <input
                                              type="text"
                                              value={opt}
                                              onChange={(e) => {
                                                const opts = [...(q.options || [])];
                                                opts[oIdx] = e.target.value;
                                                updateActiveDoc({ ...activeDoc, questions: activeDoc.questions.map(item => item.id === q.id ? { ...item, options: opts } : item) });
                                              }}
                                              className="w-full text-[11px] border rounded px-1.5 py-1 focus:ring-1 focus:ring-indigo-500"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                        <span className="text-[10px] text-slate-500 font-bold">Gabarito:</span>
                                        <select
                                          value={q.correctAnswer}
                                          onChange={(e) => {
                                            updateActiveDoc({ ...activeDoc, questions: activeDoc.questions.map(item => item.id === q.id ? { ...item, correctAnswer: e.target.value } : item) });
                                            triggerToast("Gabarito atualizado!");
                                          }}
                                          className="text-xs bg-white border rounded p-1"
                                        >
                                          {["A", "B", "C", "D"].map(l => <option key={l}>{l}</option>)}
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

                      {/* ══════════════════════════════════════════════════
                          SUB-TAB: GABARITO OFICIAL
                      ══════════════════════════════════════════════════ */}
                      {activeSheetTab === "gabarito" && (
                        <div className="space-y-6">
                          <div className="border-b-2 border-red-200 pb-2 mb-4 flex items-center justify-between">
                            <h4 className="text-base font-extrabold text-red-600 uppercase flex items-center gap-2">
                              <CheckSquare className="w-5 h-5 text-red-500" />
                              Gabarito / Respostas Oficiais
                            </h4>
                            <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 font-mono px-3 py-1 rounded">EXCLUSIVO PROFESSOR</span>
                          </div>

                          <div className="space-y-6">
                            {activeDoc.questions.map((q, idx) => (
                              <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="text-xs font-extrabold text-neutral-800 mb-2">Questão {idx + 1}</div>
                                <p className="text-xs text-neutral-600 mb-3 italic">"{q.prompt}"</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold text-slate-500">Gabarito:</span>
                                  <span className="bg-emerald-500 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-md">{q.correctAnswer}</span>
                                </div>
                                <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-100 font-mono">
                                  <span className="font-extrabold text-indigo-700 text-[10px] block uppercase mb-1">Justificativa Pedagógica:</span>
                                  {q.explanation}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Anotações do professor */}
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 border-dashed space-y-2">
                            <span className="text-xs font-extrabold text-amber-800 block uppercase">Anotações do Plano de Aula</span>
                            {editingField?.type === "gabarito-notes" ? (
                              <InlineEditTextarea value={activeDoc.gabaritoNotes || ""} onSave={saveFieldEdit} onCancel={() => setEditingField(null)} className="w-full text-xs font-mono p-3 bg-white rounded border border-amber-300 outline-none" rows={4} />
                            ) : (
                              <p onClick={() => setEditingField({ type: "gabarito-notes" })} className="text-xs text-amber-950 font-mono whitespace-pre-wrap cursor-pointer hover:bg-amber-100 p-2 rounded transition">
                                {activeDoc.gabaritoNotes || "Clique para adicionar anotações de planejamento de aula."}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    </div>{/* fim do papel A4 */}
                  </div>{/* fim do scale-wrapper */}
                </div>{/* fim da área de rolagem */}
              </div>{/* fim do canvas central */}

              {/* ── PAINEL DIREITO: Temas e exportação ─────────────────── */}
              <div className="no-print w-full lg:w-80 bg-white border-l border-slate-200 shrink-0 p-5 overflow-y-auto space-y-6">

                {/* Título do painel */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[#374151] font-extrabold text-xs uppercase tracking-wider">Modelo Visual</span>
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                </div>

                {/* Grade de temas */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Tema do Layout</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "modern-professional", label: "Moderno",   sub: "Canva & Notion" },
                        { id: "ludic-childish",      label: "Lúdico",    sub: "Anos Iniciais" },
                        { id: "minimalist",          label: "Mínimalista", sub: "Pure whitespace" },
                        { id: "classic-traditional", label: "Clássico",  sub: "Serifa acadêmica" },
                      ] as const
                    ).map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => { updateDocStyle(theme.id); triggerToast("Estilo atualizado!"); }}
                        className={`p-3 rounded-xl border text-left transition ${activeDoc.visual.style === theme.id ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 bg-slate-50"}`}
                      >
                        <div className="font-bold text-[11px] text-slate-800">{theme.label}</div>
                        <span className="text-[9px] text-slate-400">{theme.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paleta de cores */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Paleta de Cores</label>
                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    {[
                      { name: "Verde",  hex: "#10B981" },
                      { name: "Azul",   hex: "#3B82F6" },
                      { name: "Indigo", hex: "#4F46E5" },
                      { name: "Roxo",   hex: "#8B5CF6" },
                      { name: "Âmbar",  hex: "#F59E0B" },
                      { name: "Pink",   hex: "#EC4899" },
                      { name: "Dark",   hex: "#111827" },
                    ].map(col => (
                      <button
                        key={col.hex}
                        onClick={() => { updateDocColor(col.hex); triggerToast(`Cor ${col.name} aplicada!`); }}
                        title={col.name}
                        className={`w-7 h-7 rounded-full border-2 transition ${activeDoc.visual.color === col.hex ? "scale-110 border-slate-700 ring-2 ring-indigo-200" : "border-transparent"}`}
                        style={{ backgroundColor: col.hex }}
                      />
                    ))}
                    {/* Seletor de cor personalizada */}
                    <label className="relative w-7 h-7 rounded-full border border-dashed flex items-center justify-center cursor-pointer bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition">
                      <Plus className="w-4 h-4" />
                      <input type="color" value={activeDoc.visual.color} onChange={(e) => updateDocColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    </label>
                  </div>
                </div>

                {/* Seletor de fonte */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Tipografia</label>
                  <select
                    value={activeDoc.visual.fontFamily}
                    onChange={(e) => { updateDocFont(e.target.value); triggerToast(`Fonte ${e.target.value} aplicada!`); }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Inter">Inter (Padrão Moderno)</option>
                    <option value="Outfit">Outfit (Estilo Startup)</option>
                    <option value="Space Grotesk">Space Grotesk (Corporativo)</option>
                    <option value="Playfair Display">Playfair Display (Serifa Acadêmica)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Sistemas)</option>
                  </select>
                </div>

                {/* Opções de página */}
                <div className="space-y-3.5 border-t border-slate-100 pt-5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Opções da Página</label>
                  <div className="space-y-2.5">
                    {(
                      [
                        { key: "schoolHeader",    label: "Cabeçalho Escolar" },
                        { key: "footerPage",      label: "Rodapé com Numeração" },
                        { key: "gabarito",        label: "Imprimir Gabarito" },
                        { key: "spaceForAnswers", label: "Espaço Extra por Item" },
                        { key: "linesForEssay",   label: "Linhas para Dissertativas" },
                      ] as { key: keyof PageOptions; label: string }[]
                    ).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-700 font-medium">{label}</span>
                        <input type="checkbox" checked={activeDoc.pages[key]} onChange={() => togglePageOption(key)} className="rounded accent-indigo-600 h-4 w-4" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exportação */}
                <div className="space-y-2 border-t border-slate-100 pt-5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Exportar / Imprimir</span>
                  <button onClick={handleExportWord} className="w-full text-xs font-bold bg-[#2B579A] hover:bg-[#1E3E6E] text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition">
                    <FileText className="w-4 h-4 text-sky-200" />
                    Baixar em Word (.doc)
                  </button>
                  <button onClick={handlePrint} className="w-full text-xs font-bold bg-[#D32F2F] hover:bg-[#9A0F0F] text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition">
                    <Download className="w-4 h-4 text-red-200" />
                    Salvar em PDF / Imprimir
                  </button>
                  <button onClick={() => { setActiveSheetTab("gabarito"); triggerToast("Gabarito aberto no painel central!"); }} className="w-full text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 py-2 rounded-xl transition">
                    Gerar Gabarito Descritivo
                  </button>
                </div>

                {/* Compartilhamento */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Compartilhar</span>
                  <button onClick={handleCopyShareLink} className="w-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
                    <Share2 className="w-4 h-4 text-slate-400" />
                    Gerar link compartilhável
                  </button>
                </div>
              </div>

            </div>
          )}{/* fim tab gerador */}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2 — DASHBOARD DO PROFESSOR
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
              <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Dashboard Pedagógico</h2>
                  <p className="text-xs text-slate-500">Visão geral do seu portfólio e uso de créditos.</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-white border rounded px-3 py-1.5 font-bold">Hoje, {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold">Plano: EduMaker Escola</span>
                </div>
              </div>

              {/* Cards de estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Atividades Criadas",  value: activities.length,                                                            color: "text-indigo-600", sub: "Portfólio completo" },
                  { label: "Total de Questões",   value: activities.reduce((s, a) => s + a.questions.length, 0),                      color: "text-slate-800",  sub: "Banco próprio" },
                  { label: "Escolas Atendidas",   value: 3,                                                                            color: "text-emerald-600",sub: "Rede pública e privada" },
                  { label: "Créditos Restantes",  value: teacherProfile.credits,                                                       color: "text-amber-500",  sub: "Renova em Jun/2026" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="text-xs text-slate-400 font-bold uppercase">{stat.label}</div>
                    <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-500">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Templates prontos */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Modelos Prontos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRE_BAKED_ACTIVITIES.map(act => (
                    <div key={act.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer space-y-3" onClick={() => { setActiveDoc(act); setActiveTab("gerador"); triggerToast(`Modelo de ${act.config.subject} carregado!`); }}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{act.config.subject}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-850 truncate">{act.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">{act.readingPassage?.text || "Sem texto base"}</p>
                      </div>
                      <div className="text-[10px] text-indigo-500 font-bold">Usar este template →</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Banner premium */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                  <h4 className="text-lg font-black">Precisa de suporte integrado da BNCC?</h4>
                  <p className="text-xs text-slate-400 max-w-xl">Todas as atividades geradas por IA são mapeadas 1:1 com os objetivos da Base Nacional Comum Curricular.</p>
                </div>
                <button onClick={() => triggerToast("Você já possui acesso Premium completo!")} className="bg-white text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-indigo-50 shadow-lg shrink-0">
                  Ver Vantagens
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 3 — MINHAS ATIVIDADES (portfólio)
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "minhas-atividades" && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Portfólio ({activities.length})</h2>
                  <p className="text-xs text-slate-500">Histórico de atividades salvas localmente.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg w-72">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Filtrar por nome ou assunto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="text-xs bg-transparent w-full focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                    <p className="font-bold text-xs">Nenhuma atividade encontrada</p>
                    <p className="text-[10px]">Tente limpar os termos de busca.</p>
                  </div>
                ) : (
                  filteredActivities.map(act => (
                    <div key={act.id} className="bg-white border p-4 rounded-2xl hover:shadow-md transition flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">{act.config.subject}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(act.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 truncate">{act.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{act.config.theme} | {act.questions.length} questões</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => { setActiveDoc(act); setActiveSheetTab("preview"); setActiveTab("gerador"); triggerToast("Documento aberto para edição!"); }} className="text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg">
                          Visualizar &amp; Editar
                        </button>
                        <button onClick={() => { setActiveDoc(act); handleExportWord(); }} className="text-[11px] text-slate-600 hover:text-slate-800 hover:bg-slate-50 border px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-500" /> Word
                        </button>
                        <button onClick={() => { if (confirm("Apagar esta atividade permanentemente?")) { deleteActivity(act.id); triggerToast("Atividade removida!"); } }} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg ml-auto">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 4 — CONFIGURAÇÕES
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "configuracoes" && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-2xl mx-auto w-full">
              <div className="border-b pb-4">
                <h2 className="text-xl font-extrabold text-slate-800">Preferências do Sistema</h2>
                <p className="text-xs text-slate-500">Dados da instituição, docente e assistente de criação.</p>
              </div>

              {/* Perfil da escola */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b pb-1">Perfil da Unidade Escolar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold">Nome da Instituição</label>
                    <input type="text" value={schoolProfile.name} onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })} className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold">Segmento de Atuação</label>
                    <input type="text" value={schoolProfile.segment} onChange={(e) => setSchoolProfile({ ...schoolProfile, segment: e.target.value })} className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold">Estilo de Brasão</label>
                  <select value={schoolProfile.logoType} onChange={(e) => setSchoolProfile({ ...schoolProfile, logoType: e.target.value as any })} className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500">
                    <option value="shield">Escudo Clássico</option>
                    <option value="book">Livro Aberto</option>
                    <option value="star">Estrela</option>
                    <option value="circle">Circular Moderno</option>
                  </select>
                </div>
              </div>

              {/* Assistente / Professor */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Assistente Premium
                </h3>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl border border-indigo-100 space-y-1.5">
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1.5 text-xs">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    EduMaker AI Ativa
                  </span>
                  <p className="text-[11px] text-slate-600">Geração de atividades pedagógicas alinhadas à BNCC com IA.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold block">Nome do Professor</label>
                  <input
                    type="text"
                    value={teacherProfile.name}
                    onChange={(e) => {
                      setTeacherProfile({ ...teacherProfile, name: e.target.value });
                      updateActiveDoc({ ...activeDoc, teacherName: e.target.value });
                    }}
                    className="w-full text-xs p-2 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="pt-2 text-right">
                  <button onClick={() => { triggerToast("Configurações salvas!"); setActiveTab("gerador"); }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition">
                    Salvar e Voltar
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL: ALTERAR ESCOLA ATIVA ──────────────────────────────────── */}
      {showSchoolModal && (
        <div className="no-print fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-black">
              <School className="w-5 h-5" />
              <h4 className="text-sm">Configurar Escola Ativa</h4>
            </div>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold block">Nome da Escola</label>
                <input type="text" value={schoolProfile.name} onChange={(e) => { setSchoolProfile(p => ({ ...p, name: e.target.value })); updateActiveDoc({ ...activeDoc, schoolName: e.target.value }); }} className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold block">Segmento Escolar</label>
                <input type="text" value={schoolProfile.segment} onChange={(e) => setSchoolProfile(p => ({ ...p, segment: e.target.value }))} className="w-full text-xs p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button onClick={() => setShowSchoolModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg">
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PICKER DE IMAGEM ───────────────────────────────────────── */}
      {activeImagePicker && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xl w-full border border-slate-100 space-y-6">
            {/* Header do modal */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Image className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Ilustração da Atividade</h4>
                  <p className="text-[10px] text-slate-500">Adicione imagens de apoio ao conteúdo didático</p>
                </div>
              </div>
              <button onClick={() => { setActiveImagePicker(null); setCustomImageQuery(""); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sugestões de palavras-chave */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Palavras-chave sugeridas</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {["ciencias", "geografia", "historia", "mapa", "natureza", "sistema solar", "quimica", "leitura", "animais", "matematica", "geometria", "computador"].map(kw => (
                  <button key={kw} onClick={() => setCustomImageQuery(kw)} className="text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg transition">
                    +{kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de busca + botão de gerar */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500">Tema da ilustração</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: célula animal, floresta, frações..."
                  value={customImageQuery}
                  onChange={(e) => setCustomImageQuery(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const query = customImageQuery.trim() || activeDoc.config.theme || "education";
                    const url = `https://images.unsplash.com/featured/500x350?education,school,${encodeURIComponent(query)}`;
                    updateImage(activeImagePicker.type, url, query, activeImagePicker.type === "question" ? activeImagePicker.id : undefined);
                    setActiveImagePicker(null);
                    setCustomImageQuery("");
                    triggerToast("Ilustração adicionada!");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Gerar
                </button>
              </div>
            </div>

            {/* URL direta */}
            <div className="border-t pt-4 border-slate-100 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500">Ou cole uma URL de imagem</label>
              <input
                type="text"
                placeholder="https://exemplo.com/imagem.jpg"
                onChange={(e) => {
                  const url = e.target.value.trim();
                  if (url.startsWith("http")) {
                    updateImage(activeImagePicker.type, url, "URL Personalizada", activeImagePicker.type === "question" ? activeImagePicker.id : undefined);
                    setActiveImagePicker(null);
                    setCustomImageQuery("");
                  }
                }}
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Banco de ilustrações pré-prontas */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">Banco de Ilustrações Escolares</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Experimento", url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=150&q=80" },
                  { label: "Mapas",       url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=150&q=80" },
                  { label: "Livros",      url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=150&q=80" },
                  { label: "Tecnologia",  url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80" },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      updateImage(activeImagePicker.type, item.url, item.label, activeImagePicker.type === "question" ? activeImagePicker.id : undefined);
                      setActiveImagePicker(null);
                      setCustomImageQuery("");
                      triggerToast("Ilustração adicionada!");
                    }}
                    className="group border border-slate-150 hover:border-indigo-400 rounded-xl overflow-hidden text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition text-center space-y-1 active:scale-95"
                  >
                    <img src={item.url} alt={item.label} className="w-full h-14 object-cover group-hover:opacity-90" referrerPolicy="no-referrer" />
                    <div className="pb-1.5 px-1 truncate">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rodapé do modal */}
            <div className="pt-2 flex justify-between gap-2 border-t border-slate-100 text-xs">
              <button onClick={() => { removeImage(activeImagePicker.type, activeImagePicker.type === "question" ? activeImagePicker.id : undefined); setActiveImagePicker(null); setCustomImageQuery(""); triggerToast("Imagem removida!"); }} className="text-red-600 hover:bg-red-50 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Remover Imagem
              </button>
              <button onClick={() => { setActiveImagePicker(null); setCustomImageQuery(""); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2 rounded-xl">
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}