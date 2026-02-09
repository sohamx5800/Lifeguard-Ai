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
    <div className="flex items-center justify-center min-h-screen bg-[#020617] p-0 sm:p-4 font-['Inter']">
      <div className="w-full max-w-lg h-[100vh] sm:h-[850px] bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.9)] sm:rounded-[3rem] overflow-hidden flex flex-col relative border border-white/5">
        
        {/* Global Header - Tactical Redesign */}
        {activeView !== View.RESPONDER_PORTAL && (
          <header className="bg-slate-900/90 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex justify-between items-center z-[2000] shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] w-10 h-10 flex items-center justify-center shrink-0 border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20" className="text-white">
                  <path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.93V10c0 5.185-3.347 9.49-8 10.601A10.745 10.745 0 012 10V5.83a1 1 0 01.666-.93zM10.5 5a.5.5 0 00-1 0v3.5H6a.5.5 0 000 1h3.5V13a.5.5 0 001 0V9.5H14a.5.5 0 000-1h-3.5V5z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">
                LIFEGUARD <span className="text-red-500 underline underline-offset-4 decoration-2">AI</span>
              </h1>
            </div>
            
            <nav className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/5">
              <button 
                onClick={() => setActiveView(View.EMERGENCY)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeView === View.EMERGENCY 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                  : 'text-slate-500 hover:text-white'
                }`}
              >
                Emergency
              </button>
              <button 
                onClick={() => setActiveView(View.HEALTH)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeView === View.HEALTH 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-500 hover:text-white'
                }`}
              >
                Med-Hub
              </button>
            </nav>
          </header>
        )}

        <main className="flex-1 overflow-hidden bg-[#020617] flex flex-col relative">
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

        {activeView !== View.RESPONDER_PORTAL && (
          <footer className="bg-slate-900/80 border-t border-white/5 px-8 py-5 shrink-0 flex justify-between items-center z-[2000]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Node-Alpha Online</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[9px] font-black text-white uppercase tracking-widest italic">Command Terminal</div>
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">High-Precision Uplink</div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;