import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Loader2, Copy, RefreshCw, AlertCircle, Settings2, Sparkles, Check, Download } from 'lucide-react';
import { saveToHistory, incrementMetric, exportToTxt } from '../utils/storage';

export default function ContentGenerator() {
  const [formData, setFormData] = useState({
    keyword: '',
    contentType: 'Artículo de blog',
    tone: 'Informativo',
    length: '500'
  });
  
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Usamos una referencia para poder abortar la petición si el usuario cancela o sale de la página
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleGenerate = async (e, isRegenerate = false) => {
    if (e) e.preventDefault();
    if (!formData.keyword.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult('');
    setCopied(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const prompt = `Actúa como un copywriter experto en SEO. Tu tarea es generar el siguiente contenido:
- Tipo de contenido: ${formData.contentType}
- Tema principal / Palabra clave: "${formData.keyword}"
- Tono de voz: ${formData.tone}
- Longitud aproximada: ${formData.length} palabras

Por favor, asegúrate de aplicar las mejores prácticas SEO para este formato (uso de H2/H3 si es un artículo, límite de caracteres si es un título o meta descripción, inclusión natural de la palabra clave, etc.). Escribe directamente el contenido, sin introducciones ni conclusiones innecesarias tuyas.`;

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
          max_tokens: 2500,
          stream: true, // ¡Streaming en tiempo real!
          messages: [
            { role: 'user', content: prompt }
          ]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Error en la petición a la API de Claude');
      }

      // Procesar el Stream de Server-Sent Events (SSE)
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
          buffer = lines.pop() || ''; // El último segmento puede estar incompleto

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'content_block_delta' && data.delta?.text) {
                  generatedText += data.delta.text;
                  setResult(generatedText);
                }
              } catch (err) {
                // Ignorar fragmentos que no sean JSON
              }
            }
          }
        }
      }

      // Save to history once generation is fully complete
      if (generatedText) {
        saveToHistory('generator', formData.keyword, formData.contentType);
        incrementMetric('contentGenerated');
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Generación abortada por el usuario');
      } else {
        setError(err.message || 'Ocurrió un error inesperado al generar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!result) return;
    const content = `Contenido Generado: ${formData.keyword}\nTipo: ${formData.contentType}\n\n${result}`;
    exportToTxt(content, `contenido-${formData.keyword.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Generador de contenido</h1>
          <p className="text-slate-500 mt-1">Crea textos optimizados para SEO en tiempo real usando Inteligencia Artificial.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel de Configuración (Formulario) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <form onSubmit={handleGenerate} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-700">Parámetros de generación</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Palabra Clave o Tema <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="keyword"
                  required
                  value={formData.keyword}
                  onChange={handleChange}
                  placeholder="Ej: beneficios del marketing digital"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contenido</label>
                <select
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="Artículo de blog">Artículo de blog</option>
                  <option value="Meta descripción">Meta descripción</option>
                  <option value="Título SEO">Título SEO</option>
                  <option value="Párrafo introductorio">Párrafo introductorio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tono de Voz</label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="Informativo">Informativo</option>
                  <option value="Profesional">Profesional</option>
                  <option value="Cercano / Casual">Cercano / Casual</option>
                  <option value="Persuasivo / Comercial">Persuasivo / Comercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Longitud Deseada (palabras)</label>
                <select
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="Breve (aprox. 50-100 palabras)">Breve (aprox. 50-100 palabras)</option>
                  <option value="Media (aprox. 300-500 palabras)">Media (aprox. 300-500 palabras)</option>
                  <option value="Larga (aprox. 800-1000 palabras)">Larga (aprox. 800-1000 palabras)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                type="submit"
                disabled={loading || !formData.keyword.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-300 disabled:to-purple-300 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
                </span>
                <span>{loading ? 'Generando...' : 'Generar Contenido'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Panel de Resultados (Streaming) */}
        <div className="lg:col-span-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Listo para crear</h3>
              <p className="text-slate-500 max-w-sm">
                Configura los parámetros a la izquierda y pulsa "Generar" para ver la magia. El contenido se escribirá aquí en tiempo real.
              </p>
            </div>
          )}

          {(result || loading) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full min-h-[500px] flex flex-col overflow-hidden animate-in fade-in duration-500">
              {/* Header de la caja de resultado */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-sm font-medium text-slate-700">
                    {loading ? 'Escribiendo en tiempo real...' : 'Generación completada'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    disabled={!result}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="w-4 h-4 flex items-center justify-center"><Download className="w-4 h-4" /></span>
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                  <button
                    onClick={(e) => handleGenerate(e, true)}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </span>
                    <span className="hidden sm:inline">Regenerar</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!result}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all flex items-center gap-1.5 ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </span>
                    <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Contenedor del texto generado */}
              <div className="p-6 flex-1 bg-white overflow-y-auto">
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-sans flex flex-row flex-wrap">
                  <span dangerouslySetInnerHTML={{ __html: result.replace(/</g, '&lt;').replace(/>/g, '&gt;') }}></span>
                  {loading && <span className="inline-block w-2 h-5 ml-1 align-middle bg-indigo-500 animate-pulse"></span>}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
