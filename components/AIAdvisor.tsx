
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Sparkles, Loader2, Bot, FileText, X, ChevronRight, Calendar, User, Clock, Settings, Save, FileUp, Table } from 'lucide-react';
import { Employee } from '../types';
import { addDays, subDays, formatDate, parseLocalDate } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

interface AIAdvisorProps {
  initialPrompt?: string;
  employees?: Employee[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ initialPrompt = '', employees = [] }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom Template State
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [baseTemplate, setBaseTemplate] = useState(() => {
    return localStorage.getItem('vacationBaseTemplate') || '';
  });

  // Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genData, setGenData] = useState({
    empId: '',
    startDate: '',
    days: 30,
    noticeDate: ''
  });

  // Trigger ask immediately if initialPrompt changes and is not empty
  useEffect(() => {
    if (initialPrompt && initialPrompt !== prompt) {
       setPrompt(initialPrompt);
       handleAsk(initialPrompt);
    }
  }, [initialPrompt]);

  // Auto-calculate notice date when start date changes
  useEffect(() => {
    if (genData.startDate) {
      const start = parseLocalDate(genData.startDate);
      const notice = subDays(start, 45); // Default rule
      setGenData(prev => ({
        ...prev,
        noticeDate: notice.toISOString().split('T')[0]
      }));
    }
  }, [genData.startDate]);

  const saveTemplate = () => {
    localStorage.setItem('vacationBaseTemplate', baseTemplate);
    setShowTemplateEditor(false);
    alert('Modelo base salvo com sucesso!');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to plain text by extracting all non-empty cell values
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const textContent = json
        .map(row => row.filter(cell => cell !== null && cell !== undefined).join(' '))
        .filter(line => line.trim() !== '')
        .join('\n');

      if (textContent.trim()) {
        setBaseTemplate(textContent);
        alert('Conteúdo do Excel importado! Agora você pode ajustar as lacunas como [NOME] no editor.');
      } else {
        alert('Não foi possível encontrar texto legível no arquivo Excel.');
      }
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert('Erro ao ler o arquivo Excel. Certifique-se de que é um arquivo .xlsx ou .xls válido.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAsk = async (textToAsk: string = prompt) => {
    if (!textToAsk.trim()) return;

    setLoading(true);
    setResponse('');
    if (textToAsk !== prompt) setPrompt(textToAsk);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToAsk,
        config: {
          systemInstruction: "Você é um especialista em Recursos Humanos do Brasil, com foco profundo na CLT. Seu objetivo é gerar documentos e tirar dúvidas. Se o usuário fornecer um 'MODELO BASE', você deve usá-lo EXATAMENTE, mantendo toda a estrutura original e substituindo apenas as informações variáveis (lacunas). Se o modelo original estiver em formato de planilha (tabela), tente reproduzir a estrutura textual dele de forma organizada. Use linguagem formal jurídica.",
        }
      });
      
      setResponse(model.text || "Desculpe, não consegui gerar uma resposta no momento.");
      setShowGenerator(false);
    } catch (error) {
      console.error("Error asking AI:", error);
      setResponse("Ocorreu um erro ao conectar com o assistente inteligente. Verifique sua chave de API.");
    } finally {
      setLoading(false);
    }
  };

  const generatePromptFromForm = () => {
    const emp = employees.find(e => e.id === genData.empId);
    if (!emp || !genData.startDate || !genData.noticeDate) return;

    const start = parseLocalDate(genData.startDate);
    const end = addDays(start, genData.days - 1); 
    const returnDate = addDays(start, genData.days);
    const notice = parseLocalDate(genData.noticeDate);

    let generatedPrompt = '';
    
    if (baseTemplate.trim()) {
      generatedPrompt = `Use o MODELO BASE abaixo para gerar o Aviso de Férias. 
Substitua os campos necessários com estes dados:
- Nome do Colaborador: ${emp.name}
- Cargo: ${emp.role}
- Departamento: ${emp.department}
- Data de Início das Férias: ${formatDate(start)}
- Data de Término das Férias: ${formatDate(end)}
- Período de Gozo (dias): ${genData.days}
- Data de Retorno ao Trabalho: ${formatDate(returnDate)}
- Data de Emissão do Aviso: ${formatDate(notice)}

MODELO BASE:
"""
${baseTemplate}
"""`;
    } else {
      generatedPrompt = `Gere um "Aviso de Férias" formal para o colaborador ${emp.name} (${emp.role}), departamento ${emp.department}. 
Início: ${formatDate(start)}, Término: ${formatDate(end)}, Dias: ${genData.days}, Retorno: ${formatDate(returnDate)}. 
Data do documento: ${formatDate(notice)}. Use o Art. 135 da CLT.`;
    }

    setPrompt(generatedPrompt);
    handleAsk(generatedPrompt);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-lg">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Assistente de RH</h2>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowTemplateEditor(!showTemplateEditor);
              setShowGenerator(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showTemplateEditor ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200'}`}
            title="Configurar seu modelo de texto fixo"
          >
            <Settings className="w-3.5 h-3.5" />
            {showTemplateEditor ? 'Fechar Modelo' : 'Meu Modelo Base'}
          </button>

          <button
            onClick={() => {
              setShowGenerator(!showGenerator);
              setShowTemplateEditor(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showGenerator ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200'}`}
          >
            {showGenerator ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {showGenerator ? 'Fechar' : 'Gerar Documento'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
        {/* Template Editor */}
        {showTemplateEditor && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-xl p-5 mb-4 animate-fade-in-down">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide mb-1 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Seu Modelo de Aviso de Férias
                </h3>
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  Cole seu modelo ou <strong>importe um arquivo Excel</strong> para extrair o texto.
                </p>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800/50 transition-colors shadow-sm"
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5" />}
                  Importar Excel
                </button>
              </div>
            </div>

            <textarea
              className="w-full h-48 p-3 text-sm border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-orange-400 outline-none font-mono"
              placeholder="Ex: Eu, [NOME], portador do cargo [CARGO], aviso que entrarei em férias no dia [DATA_INICIO]..."
              value={baseTemplate}
              onChange={(e) => setBaseTemplate(e.target.value)}
            />
            
            <div className="mt-4 flex justify-end">
               <button
                 onClick={saveTemplate}
                 className="bg-orange-600 dark:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-sm"
               >
                 <Save className="w-4 h-4" />
                 Salvar Modelo Base
               </button>
            </div>
          </div>
        )}

        {/* Generator Panel */}
        {showGenerator && (
          <div className="bg-indigo-50 dark:bg-slate-700/50 border border-indigo-100 dark:border-slate-600 rounded-xl p-5 mb-4 animate-fade-in-down">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Preencher Dados para o Documento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Colaborador</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    value={genData.empId}
                    onChange={e => setGenData({...genData, empId: e.target.value})}
                  >
                    <option value="">Selecione um colaborador...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} - {e.role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Início das Férias</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:[color-scheme:dark]"
                  value={genData.startDate}
                  onChange={e => setGenData({...genData, startDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Duração</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={genData.days}
                  onChange={e => setGenData({...genData, days: Number(e.target.value)})}
                >
                  <option value={30}>30 dias</option>
                  <option value={20}>20 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={10}>10 dias</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                {baseTemplate.trim() ? '✅ Usando seu modelo personalizado' : 'ℹ️ Usando modelo padrão do sistema'}
              </span>
              <button
                disabled={!genData.empId || !genData.startDate || loading}
                onClick={generatePromptFromForm}
                className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar com IA
              </button>
            </div>
          </div>
        )}

        {/* Chat History / Response */}
        {response ? (
          <div className="flex gap-4 animate-fade-in">
             <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
             </div>
             <div className="prose prose-slate dark:prose-invert max-w-none bg-indigo-50/50 dark:bg-indigo-900/20 p-6 rounded-2xl rounded-tl-none border border-indigo-100 dark:border-indigo-800 w-full shadow-sm">
               <div className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono text-sm selection:bg-indigo-200 dark:selection:bg-indigo-800">
                  {response}
               </div>
               <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800 flex justify-end">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(response);
                      alert('Texto copiado!');
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:bg-white/50 dark:hover:bg-black/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Copiar Documento
                  </button>
               </div>
             </div>
          </div>
        ) : !showGenerator && !showTemplateEditor && (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4 py-10">
             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                <Sparkles className="w-8 h-8 text-indigo-300 dark:text-indigo-600" />
             </div>
             <p className="text-center max-w-md text-sm">
               Configure seu <strong>Modelo Base</strong> (pode ser via importação de Excel) ou use o <strong>Gerador</strong> para criar documentos automáticos.
             </p>
           </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <div className="relative">
          <textarea
            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-none text-sm dark:text-white"
            rows={2}
            placeholder="Dúvida sobre CLT ou prazos?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk(prompt);
              }
            }}
          />
          <button
            onClick={() => handleAsk(prompt)}
            disabled={loading || !prompt.trim()}
            className="absolute right-3 bottom-2.5 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
