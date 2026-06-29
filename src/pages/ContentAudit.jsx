import React, { useState } from 'react';
import { FileText, Loader2, AlertCircle, FileSearch, CheckCircle2, ChevronRight, Activity, Download } from 'lucide-react';
import { saveToHistory, saveLastScore, exportToTxt } from '../utils/storage';

export default function ContentAudit() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleAudit = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);

    const prompt = `
Eres un experto en SEO y auditoría de contenido. Analiza el siguiente texto y devuelve ÚNICAMENTE un objeto JSON con la estructura mostrada a continuación, sin ningún texto adicional ni bloques markdown.

Estructura JSON requerida:
{
  "score": 85, // Puntuación global SEO del 0 al 100
  "density": "2.5%", // Densidad estimada de la palabra clave principal aparente
  "readability": "Buena", // Excelente, Buena, Regular, o Mala
  "length": {
    "actual": 450, // Número aproximado de palabras en el texto
    "recommended": 1000 // Número de palabras recomendado
  },
  "headers": {
    "h1": 1, // Cuántos H1 aparentan haber (o títulos principales)
    "h2": 3,
    "h3": 0
  },
  "issues": [
    {
      "description": "Falta un H1 claro al principio",
      "severity": "Alta" // Puede ser Alta, Media o Baja
    }
  ]
}

Texto a analizar:
"""
${text}
"""
`;

    try {
      const response = await fetch('/api/anthropic/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Error en la petición a la API de Claude');
      }

      const data = await response.json();
      const contentText = data.content[0].text;
      
      const jsonStr = contentText.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResults = JSON.parse(jsonStr);
      
      setResults(parsedResults);
      saveToHistory('audit', 'Documento Auditado', `Puntuación: ${parsedResults.score}/100`);
      saveLastScore(parsedResults.score);
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado al analizar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const CircularProgress = ({ score }) => {
    const safeScore = Number(score) || 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (safeScore / 100) * circumference;
    
    let colorClass = 'text-emerald-500';
    if (safeScore < 50) colorClass = 'text-red-500';
    else if (safeScore < 80) colorClass = 'text-amber-500';

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle cx="56" cy="56" r="36" className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
          <circle 
            cx="56" cy="56" r="36" 
            className={`${colorClass} transition-all duration-1000 ease-out`} 
            strokeWidth="8" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            stroke="currentColor" 
            fill="transparent" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{safeScore}</span>
        </div>
      </div>
    );
  };

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toLowerCase();
    if (s === 'alta') return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Alta</span>;
    if (s === 'media') return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Media</span>;
    return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Baja</span>;
  };

  const handleExport = () => {
    if (!results) return;
    let content = `Auditoría SEO\n\nPuntuación Global: ${results.score}/100\n`;
    content += `Densidad Keyword: ${results.density}\nLegibilidad: ${results.readability}\n`;
    content += `Longitud: ${results.length?.actual || 0} de ${results.length?.recommended || 0} palabras\n\n`;
    content += `Estructura H1/H2/H3: ${results.headers?.h1||0} / ${results.headers?.h2||0} / ${results.headers?.h3||0}\n\n`;
    content += `Problemas Detectados:\n`;
    (results.issues||[]).forEach(i => content += `- [${i.severity}] ${i.description}\n`);
    exportToTxt(content, `auditoria-seo.txt`);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Auditoría de contenido</h1>
          <p className="text-slate-500 mt-1">Pega tu artículo y obtén un análisis SEO profundo en segundos.</p>
        </div>
        {results && (
          <button onClick={handleExport} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm">
            <span className="w-4 h-4 flex items-center justify-center"><Download className="w-4 h-4" /></span>
            <span>Exportar TXT</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor de Texto */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-700">Contenido a auditar</h2>
            </div>
            <textarea
              className="flex-1 w-full p-6 resize-none focus:outline-none focus:ring-0 text-slate-700 leading-relaxed bg-white"
              placeholder="Pega el texto de tu artículo o blog aquí..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={handleAudit}
                disabled={loading || !text.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSearch className="w-5 h-5" />}
                {loading ? 'Analizando...' : 'Auditar Contenido'}
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Resultados */}
        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!results && !loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <Activity className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Esperando contenido</h3>
              <p className="text-slate-500 max-w-sm">
                Pega tu texto a la izquierda y pulsa "Auditar". Claude analizará la estructura, longitud, densidad y te dará una puntuación SEO global.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Evaluando factores SEO</h3>
              <p className="text-slate-500 animate-pulse">Analizando densidad, legibilidad y encabezados...</p>
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              
              {/* Score General */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-8">
                <CircularProgress score={results.score} />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Puntuación SEO Global</h2>
                  <p className="text-slate-500 text-sm">
                    {results.score >= 80 ? '¡Excelente trabajo! Tu contenido está muy bien optimizado.' : 
                     results.score >= 50 ? 'Tienes un buen contenido, pero hay áreas clave de mejora.' : 
                     'Se requiere una reestructuración importante para mejorar el posicionamiento.'}
                  </p>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Densidad Kw</span>
                  <span className="text-xl font-bold text-slate-800">{results.density || 'N/A'}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Legibilidad</span>
                  <span className="text-xl font-bold text-slate-800">{results.readability || 'N/A'}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Palabras</span>
                  <span className="text-xl font-bold text-slate-800">{results.length?.actual || 0}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Objetivo</span>
                  <span className="text-xl font-bold text-blue-600">{results.length?.recommended || 0}</span>
                </div>
              </div>

              {/* Detalles Estructurales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Encabezados */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    Estructura de Encabezados
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">H1</span>
                        <span className="text-sm text-slate-600">Título principal</span>
                      </div>
                      <span className={`font-bold ${results.headers?.h1 === 1 ? 'text-emerald-600' : 'text-red-500'}`}>{results.headers?.h1 || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-px"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">H2</span>
                        <span className="text-sm text-slate-600">Subtítulos</span>
                      </div>
                      <span className="font-bold text-slate-700">{results.headers?.h2 || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-px"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">H3</span>
                        <span className="text-sm text-slate-600">Sub-secciones</span>
                      </div>
                      <span className="font-bold text-slate-700">{results.headers?.h3 || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Longitud Progress */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
                  <h3 className="font-semibold text-slate-800 mb-4">Progreso de Longitud</h3>
                  <div className="relative pt-1 mb-2">
                    <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-slate-100">
                      <div 
                        style={{ width: `${Math.min(100, ((results.length?.actual || 0) / (results.length?.recommended || 1)) * 100)}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 text-center">
                    Tienes <span className="font-bold text-slate-700">{results.length?.actual || 0}</span> de <span className="font-bold text-slate-700">{results.length?.recommended || 0}</span> palabras sugeridas para competir en la primera página.
                  </p>
                </div>

              </div>

              {/* Lista de Problemas Detectados */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Problemas Detectados ({Array.isArray(results.issues) ? results.issues.length : 0})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {Array.isArray(results.issues) && results.issues.length > 0 ? (
                    results.issues.map((issue, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                        <div className="mt-1">
                          {issue.severity?.toLowerCase() === 'alta' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : issue.severity?.toLowerCase() === 'media' ? (
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-800 font-medium text-sm mb-1">{issue.description}</p>
                        </div>
                        <div>
                          {getSeverityBadge(issue.severity)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      No se detectaron problemas significativos. ¡Buen trabajo!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
