// Utilidades para Exportación y Almacenamiento Local

export const exportToTxt = (content, filename = 'seo-master-export.txt') => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const HISTORY_KEY = 'seo_master_history';

// Guarda un elemento en el historial (máximo 5)
export const saveToHistory = (type, title, dataSummary) => {
  try {
    const currentHistory = getHistory();
    const newItem = {
      id: Date.now().toString(),
      type, // 'keyword', 'audit', 'generator', 'suggestion'
      title, // ej: "recetas veganas", "Puntuación 85"
      dataSummary,
      date: new Date().toISOString()
    };
    
    // Añadimos al inicio y cortamos a 5 elementos
    const newHistory = [newItem, ...currentHistory].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (err) {
    console.error('Error guardando en historial', err);
  }
};

export const getHistory = () => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

// Métricas acumulativas (opcional, calculadas a partir del historial o almacenadas aparte)
const METRICS_KEY = 'seo_master_metrics';

export const incrementMetric = (key) => {
  try {
    const metrics = getMetrics();
    metrics[key] = (metrics[key] || 0) + 1;
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch (err) {}
};

export const saveLastScore = (score) => {
  try {
    const metrics = getMetrics();
    metrics.lastScore = score;
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch (err) {}
}

export const getMetrics = () => {
  try {
    const data = localStorage.getItem(METRICS_KEY);
    return data ? JSON.parse(data) : { keywordsAnalyzed: 0, contentGenerated: 0, lastScore: '-' };
  } catch (err) {
    return { keywordsAnalyzed: 0, contentGenerated: 0, lastScore: '-' };
  }
};
