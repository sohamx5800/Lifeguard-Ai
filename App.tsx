
import React, { useState } from 'react';
import EmergencyModule from './components/EmergencyModule';
import HealthModule from './components/HealthModule';
import ResponderPortal from './components/ResponderPortal';
import { View, EmergencyEvent } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.EMERGENCY);
  const [activeEvent, setActiveEvent] = useState<EmergencyEvent | null>(null);

  const handleOpenResponderPortal = (event: EmergencyEvent) => {
    setActiveEvent(event);
    setActiveView(View.RESPONDER_PORTAL);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative font-['Inter']">
      {/* Global Header */}
      {activeView !== View.RESPONDER_PORTAL && (
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-[2000] shrink-0">
          <div>
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-1.5 text-slate-900">
              <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.93V10c0 5.185-3.347 9.49-8 10.601A10.745 10.745 0 012 10V5.83a1 1 0 01.666-.93zM10.5 5a.5.5 0 00-1 0v3.5H6a.5.5 0 000 1h3.5V13a.5.5 0 001 0V9.5H14a.5.5 0 000-1h-3.5V5z" clipRule="evenodd" />
                </svg>
              </div>
              LIFEGUARD <span className="text-red-600">AI</span>
            </h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button 
              onClick={() => setActiveView(View.EMERGENCY)}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeView === View.EMERGENCY 
                ? 'bg-white text-red-600 shadow-md ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              SOS
            </button>
            <button 
              onClick={() => setActiveView(View.HEALTH)}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeView === View.HEALTH 
                ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Health
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden bg-[#0a0c10] flex flex-col relative">
        {activeView === View.EMERGENCY && (
          <EmergencyModule onOpenResponderPortal={handleOpenResponderPortal} />
        )}
        {activeView === View.HEALTH && (
          <HealthModule />
        )}
        {activeView === View.RESPONDER_PORTAL && activeEvent && (
          <ResponderPortal 
            event={activeEvent} 
            onClose={() => setActiveView(View.EMERGENCY)} 
          />
        )}
      </main>

      {/* Global Status Bar */}
      {activeView !== View.RESPONDER_PORTAL && (
        <footer className="bg-white border-t border-slate-200 px-6 py-4 shrink-0 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-[2000]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Security Node</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">INDIA REGION</div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
