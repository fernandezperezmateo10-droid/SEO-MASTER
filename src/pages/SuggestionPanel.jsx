import React, { useState, useRef, useEffect } from 'react';
import { 
  Lightbulb, Loader2, AlertCircle, Link as LinkIcon, 
  Search, Code, LayoutTemplate, PlayCircle, 
  X, Copy, Check, ChevronRight, Download 
} from 'lucide-react';
import { saveToHistory, exportToTxt } from '../utils/storage';

export default function SuggestionPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  // Estados para el Modal de Implementación
  const [activeItem, setActiveItem] = useState(null);
  const [implementing, setImplementing] = useState(false);
  const [implementationResult, setImplementationResult] = useState('');
  const [copied, setCopied] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const prompt = `Analiza el siguiente texto o URL y devuelve ÚNICAMENTE un JSON estricto con un plan de acción SEO. No incluyas nada de texto fuera del JSON.

Estructura estricta requerida:
{
  "urgentImprovements": [ { "title": "Título del problema", "description": "Descripción", "actionPrompt": "Instrucción detallada para que una IA genere la solución (ej: Escribe un nuevo primer párrafo optimizado para...)" } ],
  "keywordOpportunities": [ { "keyword": "Palabra clave", "reason": "Por qué usarla", "actionPrompt": "Instrucción para integrar esta palabra clave" } ],
  "internalLinking": [ { "suggestion": "Sugerencia de enlace", "actionPrompt": "Instrucción para generar el bloque de texto con el enlace" } ],
  "metaTags": [ { "type": "Meta Title o Description", "current": "Valor actual o ausente", "issue": "Problema", "actionPrompt": "Genera 3 opciones de meta etiquetas optimizadas" } ],
  "structure": [ { "recommendation": "Sugerencia de encabezados H1/H2", "actionPrompt": "Reescribe la estructura de encabezados" } ]
}

Contenido/URL a analizar:
"""
${input}
"""`;

      const response = await fetch('/api/anthropic/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Error en la petición a la API');
      }

      const data = await response.json();
      const contentText = data.content[0].text;
      
      const jsonStr = contentText.replace(/```json\n?|\n?```/g, '').trim();
      const parsedPlan = JSON.parse(jsonStr);
      setPlan(parsedPlan);
      saveToHistory('suggestion', 'Sugerencias SEO', `${parsedPlan.urgentImprovements?.length || 0} problemas detectados`);

    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('El texto de la web es demasiado extenso y la IA agotó su límite de memoria antes de terminar de responder. Intenta con un texto más corto.');
      } else {
        setError(err.message || 'Error al analizar el contenido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImplement = async (item, categoryName) => {
    setActiveItem({ ...item, categoryName });
    setImplementing(true);
    setImplementationResult('');
    setCopied(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const prompt = `Actúa como un experto en SEO. Realiza la siguiente tarea de implementación basándote en la sugerencia detectada previamente.

Tarea requerida: ${item.actionPrompt}
Contexto original (Texto o URL proporcionada por el usuario): """${input}"""

Devuelve directamente el texto mejorado, código HTML necesario o las etiquetas optimizadas, sin introducciones explicativas ni texto previo. Genera la mejor solución posible.`;

      const response = await fetch('/api/anthropic/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          stream: true,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Error al generar la implementación');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';
      let generatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  generatedText += data.delta.text;
                  setImplementationResult(generatedText);
                }
              } catch (e) { }
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setImplementationResult('Error: No se pudo generar la implementación. ' + err.message);
      }
    } finally {
      setImplementing(false);
    }
  };

  const copyImplementation = () => {
    navigator.clipboard.writeText(implementationResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeImplementation = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setActiveItem(null);
  };

  // Renderizador de Secciones (seguro para evitar crashes de insertBefore)
  const renderSection = (items, icon, title, colorClass) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50`}>
          <div className={`p-2 rounded-lg ${colorClass.bg} ${colorClass.text}`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-slate-800 text-lg">
                  {item.title || item.keyword || item.type || item.suggestion || item.recommendation}
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {item.description || item.reason || item.issue || ''}
                </p>
                {item.current && (
                  <div className="text-sm bg-slate-100 text-slate-600 p-2 rounded-md font-mono mt-2">
                    Actual: {item.current}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleImplement(item, title)}
                className="shrink-0 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-medium py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  <PlayCircle className="w-5 h-5" />
                </span>
                <span>Implementar</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleExportPlan = () => {
    if (!plan) return;
    let content = `Plan de Acción SEO\n\n`;
    const sections = [
      { key: 'urgentImprovements', title: 'Mejoras Urgentes' },
      { key: 'keywordOpportunities', title: 'Oportunidades de Keywords' },
      { key: 'metaTags', title: 'Meta Tags' },
      { key: 'structure', title: 'Estructura' },
      { key: 'internalLinking', title: 'Enlaces Internos' }
    ];
    sections.forEach(sec => {
      if (plan[sec.key] && plan[sec.key].length > 0) {
        content += `--- ${sec.title} ---\n`;
        plan[sec.key].forEach(item => {
           content += `- ${item.title || item.keyword || item.type || item.suggestion || item.recommendation}\n  ${item.description || item.reason || item.issue || ''}\n`;
        });
        content += `\n`;
      }
    });
    exportToTxt(content, 'plan-sugerencias-seo.txt');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de sugerencias SEO</h1>
          <p className="text-slate-500 mt-1">Descubre oportunidades ocultas y genera mejoras al instante.</p>
        </div>
        {plan && (
          <button onClick={handleExportPlan} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm">
            <span className="w-4 h-4 flex items-center justify-center"><Download className="w-4 h-4" /></span>
            <span>Exportar Plan</span>
          </button>
        )}
      </div>

      {/* Caja de Input */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          URL o Texto del Contenido
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <textarea
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
            placeholder="Pega el texto de tu web, o introduce una URL..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="md:w-48 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20"
          >
            <span className="flex items-center justify-center w-5 h-5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
            </span>
            <span>{loading ? 'Analizando...' : 'Analizar'}</span>
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Resultados del Plan */}
      {plan && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {renderSection(plan.urgentImprovements, <AlertCircle className="w-5 h-5" />, "Top 5 Mejoras Urgentes", {bg: 'bg-red-100', text: 'text-red-600'})}
          {renderSection(plan.keywordOpportunities, <Search className="w-5 h-5" />, "Oportunidades de Keywords", {bg: 'bg-emerald-100', text: 'text-emerald-600'})}
          {renderSection(plan.metaTags, <Code className="w-5 h-5" />, "Optimización de Meta Tags", {bg: 'bg-indigo-100', text: 'text-indigo-600'})}
          {renderSection(plan.structure, <LayoutTemplate className="w-5 h-5" />, "Recomendaciones de Estructura", {bg: 'bg-amber-100', text: 'text-amber-600'})}
          {renderSection(plan.internalLinking, <LinkIcon className="w-5 h-5" />, "Estrategia de Enlaces", {bg: 'bg-blue-100', text: 'text-blue-600'})}
        </div>
      )}

      {/* Modal / Panel Superpuesto de Implementación */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <PlayCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800">Generando Implementación</h3>
                  <p className="text-xs text-slate-500">{activeItem.categoryName}</p>
                </div>
              </div>
              <button 
                onClick={closeImplementation}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  <X className="w-5 h-5" />
                </span>
              </button>
            </div>

            <div className="p-6 bg-blue-50/50 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500" />
                Resolviendo: {activeItem.title || activeItem.keyword || activeItem.type || activeItem.suggestion || activeItem.recommendation}
              </p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-white min-h-[300px]">
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-sans flex flex-row flex-wrap">
                <span dangerouslySetInnerHTML={{ __html: implementationResult.replace(/</g, '&lt;').replace(/>/g, '&gt;') }}></span>
                {implementing && <span className="inline-block w-2 h-5 ml-1 align-middle bg-blue-500 animate-pulse"></span>}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={closeImplementation}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={copyImplementation}
                disabled={!implementationResult || implementing}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400'
                }`}
              >
                <span className="flex items-center justify-center w-4 h-4">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </span>
                <span>{copied ? 'Copiado al portapapeles' : 'Copiar Solución'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
