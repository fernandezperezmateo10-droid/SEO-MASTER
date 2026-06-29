import React, { useEffect, useState } from 'react';
import { getHistory, getMetrics } from '../utils/storage';
import { Link } from 'react-router-dom';
import { 
  BarChart3, FileText, PenTool, Lightbulb, 
  Activity, ArrowRight, History, Zap, Search 
} from 'lucide-react';

export default function HomeDashboard() {
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({ keywordsAnalyzed: 0, contentGenerated: 0, lastScore: '-' });

  useEffect(() => {
    setHistory(getHistory());
    setMetrics(getMetrics());
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case 'keyword': return <Search className="w-5 h-5 text-blue-500" />;
      case 'audit': return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'generator': return <PenTool className="w-5 h-5 text-purple-500" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-amber-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getLabelForType = (type) => {
    switch (type) {
      case 'keyword': return 'Análisis Keyword';
      case 'audit': return 'Auditoría SEO';
      case 'generator': return 'Generación';
      case 'suggestion': return 'Sugerencias';
      default: return 'Actividad';
    }
  };

  const getPathForType = (type) => {
    switch (type) {
      case 'keyword': return '/keywords';
      case 'audit': return '/audit';
      case 'generator': return '/generator';
      case 'suggestion': return '/suggestions';
      default: return '/';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido a SEO Master</h1>
        <p className="text-slate-500 mt-1">Resumen de tu actividad reciente y rendimiento general.</p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Última Auditoría</p>
            <p className="text-3xl font-bold text-slate-800"><span>{metrics.lastScore}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Keywords Analizadas</p>
            <p className="text-3xl font-bold text-slate-800"><span>{metrics.keywordsAnalyzed}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contenidos Creados</p>
            <p className="text-3xl font-bold text-slate-800"><span>{metrics.contentGenerated}</span></p>
          </div>
        </div>
      </div>

      {/* Historial Reciente */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-2">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Actividad Reciente</h3>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">Últimos 5 registros</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getIconForType(item.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800"><span>{item.title}</span></h4>
                    <p className="text-sm text-slate-500"><span>{getLabelForType(item.type)}</span> • <span>{new Date(item.date).toLocaleDateString()}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500 hidden md:block">
                    <span>{item.dataSummary}</span>
                  </div>
                  <Link 
                    to={getPathForType(item.type)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ir a la herramienta"
                  >
                    <span className="w-5 h-5 flex justify-center items-center">
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No hay actividad reciente.</p>
              <p className="text-sm text-slate-400 mt-1">Explora las herramientas del menú para comenzar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
