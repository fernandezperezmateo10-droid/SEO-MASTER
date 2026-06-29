import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, Database, Download } from 'lucide-react';
import { saveToHistory, incrementMetric, exportToTxt } from '../utils/storage';

export default function KeywordAnalysis() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const prompt = `
Eres un experto en SEO. Analiza el siguiente tema o URL y sugiere una tabla de palabras clave relacionadas.
Devuelve ÚNICAMENTE un arreglo en formato JSON con la siguiente estructura, sin ningún texto adicional, ni bloques de código markdown, solo el JSON puro. Necesito al menos 5 palabras clave.

[
  {
    "keyword": "palabra clave",
    "variations": ["variacion1", "variacion2"],
    "volume": "Alto", // Puede ser Bajo, Medio o Alto
    "difficulty": 45, // Un número del 1 al 100
    "intent": "Informacional" // Puede ser Informacional, Transaccional o Navegacional
  }
]

Tema o URL a analizar: "${query}"
`;

      // Hacemos la petición al proxy (Vite o Vercel)
      const response = await fetch('/api/anthropic/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', // Usando exactamente el modelo solicitado
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
      
      // Intentar parsear la respuesta. Si incluyó markdown, limpiarlo
      const jsonStr = contentText.replace(/```json\n?|\n?```/g, '').trim();
      let parsedResults = JSON.parse(jsonStr);
      
      // Asegurar que sea un array
      if (!Array.isArray(parsedResults)) {
        // Si Claude devolvió un objeto con una propiedad que es el array
        const possibleArray = Object.values(parsedResults).find(val => Array.isArray(val));
        if (possibleArray) {
          parsedResults = possibleArray;
        } else {
          parsedResults = [parsedResults];
        }
      }
      
      setResults(parsedResults);
      saveToHistory('keyword', query, `Encontradas ${parsedResults.length} palabras clave`);
      incrementMetric('keywordsAnalyzed');
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado al analizar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIntentColor = (intent) => {
    const safeIntent = intent || '';
    switch (safeIntent.toLowerCase()) {
      case 'informacional': return 'bg-blue-100 text-blue-700';
      case 'transaccional': return 'bg-emerald-100 text-emerald-700';
      case 'navegacional': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getVolumeColor = (volume) => {
    const safeVolume = volume || '';
    switch (safeVolume.toLowerCase()) {
      case 'alto': return 'bg-red-100 text-red-700';
      case 'medio': return 'bg-amber-100 text-amber-700';
      case 'bajo': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficultyColor = (diff) => {
    const safeDiff = Number(diff) || 0;
    if (safeDiff > 70) return 'text-red-600';
    if (safeDiff > 40) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const handleExport = () => {
    if (!results) return;
    const content = `Análisis de Keywords para: ${query}\n\n` + 
      results.map(r => `Keyword: ${r.keyword}\nVariaciones: ${(r.variations||[]).join(', ')}\nVolumen: ${r.volume}\nDificultad: ${r.difficulty}\nIntención: ${r.intent}\n---`).join('\n');
    exportToTxt(content, `keywords-${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Análisis de palabras clave</h1>
          <p className="text-slate-500 mt-1">Descubre qué está buscando tu audiencia usando IA.</p>
        </div>
        {results && (
          <button onClick={handleExport} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 shadow-sm">
            <span className="w-4 h-4 flex items-center justify-center"><Download className="w-4 h-4" /></span>
            <span>Exportar TXT</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Ingresa una URL o un tema (ej. Zapatillas deportivas)..." 
              className="w-full pl-10 pr-28 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
            />
            <button 
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-1.5 rounded-md font-medium transition-colors text-sm flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Analizar
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {!results && !loading && !error && (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
            <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Comienza tu investigación</h3>
            <p className="max-w-md text-sm text-slate-500">Ingresa un tema o URL arriba para pedirle a Claude que genere un análisis detallado de palabras clave, incluyendo volumen, dificultad e intención de búsqueda.</p>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Analizando con Claude-sonnet-4-6...</p>
            <p className="text-sm text-slate-400 mt-1">Evaluando volumen e intenciones de búsqueda</p>
          </div>
        )}

        {Array.isArray(results) && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Keyword Principal</th>
                  <th className="px-6 py-4">Variaciones</th>
                  <th className="px-6 py-4 text-center">Volumen</th>
                  <th className="px-6 py-4 text-center">Dificultad (1-100)</th>
                  <th className="px-6 py-4 text-center">Intención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((item, idx) => {
                  const safeDifficulty = Number(item.difficulty) || 0;
                  return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{item.keyword || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(item.variations) ? item.variations : []).map((v, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getVolumeColor(item.volume)}`}>
                        {item.volume || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-bold ${getDifficultyColor(safeDifficulty)}`}>{safeDifficulty}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${safeDifficulty > 70 ? 'bg-red-500' : safeDifficulty > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${safeDifficulty}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getIntentColor(item.intent)}`}>
                        {item.intent || 'N/A'}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
