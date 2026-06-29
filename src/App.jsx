import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import KeywordAnalysis from './pages/KeywordAnalysis';
import ContentAudit from './pages/ContentAudit';
import ContentGenerator from './pages/ContentGenerator';
import SuggestionPanel from './pages/SuggestionPanel';
import HomeDashboard from './pages/HomeDashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex flex-col w-full h-[100dvh] overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
          <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<HomeDashboard />} />
              <Route path="/keywords" element={<KeywordAnalysis />} />
              <Route path="/audit" element={<ContentAudit />} />
              <Route path="/generator" element={<ContentGenerator />} />
              <Route path="/suggestions" element={<SuggestionPanel />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
