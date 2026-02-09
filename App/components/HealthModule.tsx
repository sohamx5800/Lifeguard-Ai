import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Prescription, Medicine } from '../types';
import { generateHealthResponse } from '../services/geminiService';

const HealthModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm your LifeGuard AI Health Assistant. Describe your symptoms, and I will generate a digital prescription and medicine list for you.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOrdering]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Map current message history to Gemini format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const rawResponse = await generateHealthResponse(input, history);
      
      let finalMsg: ChatMessage;
      try {
        const data = JSON.parse(rawResponse);
        finalMsg = {
          id: Date.now().toString(),
          role: 'model',
          text: data.text || "I have analyzed your request.",
          timestamp: new Date(),
          prescription: data.prescription
        };
      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError, rawResponse);
        finalMsg = { 
          id: Date.now().toString(), 
          role: 'model', 
          text: "I received an invalid response from the medical core. Please try rephrasing your symptoms.", 
          timestamp: new Date() 
        };
      }

      setMessages(prev => [...prev, finalMsg]);
    } catch (error: any) {
      console.error("Connectivity Error:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `Error connecting to AI Node: ${error.message || "Unknown error"}. Please check your connection and try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleOrderMedicines = () => {
    setIsOrdering(true);
    setTimeout(() => {
      setIsOrdering(false);
      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "✅ Order Placed! Medicines are being dispatched from the nearest pharmacy to your GPS location.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMsg]);
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] relative">
      <div className="p-4 bg-slate-900 border-b border-white/5 flex justify-between items-center shrink-0">
        <h2 className="font-black text-white tracking-tight uppercase text-[10px] flex items-center gap-2 italic">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
          Health Assistant Node-01 (Pro)
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-lg text-[13px] leading-relaxed font-medium ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-900 text-slate-300 border border-white/10 rounded-bl-none'
            }`}>
              {m.text}
            </div>
            
            {m.prescription && (
              <div className="w-full max-w-[90%] mt-4 bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl print:bg-white print:text-black">
                 <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Digital Prescription</h4>
                      <p className="text-[8px] text-slate-500 font-black uppercase">LifeGuard Node ID: {m.id}</p>
                    </div>
                    <button onClick={handleDownloadPDF} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-blue-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                 </div>

                 <div className="mb-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Assessment</p>
                    <p className="text-sm font-bold text-slate-200">{m.prescription.diagnosis}</p>
                 </div>

                 <div className="space-y-3 mb-8">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recommended Pharmacy List</p>
                    {m.prescription.medicines.map((med, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                        <div>
                          <p className="text-xs font-black text-white uppercase">{med.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{med.dosage} • {med.purpose}</p>
                        </div>
                        <p className="text-xs font-black text-blue-400">₹{med.price}</p>
                      </div>
                    ))}
                 </div>

                 <button 
                  onClick={handleOrderMedicines}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all italic"
                 >
                   Instant Dispatch Now
                 </button>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-white/10 p-4 rounded-3xl rounded-bl-none">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}
        {isOrdering && (
           <div className="flex flex-col items-center justify-center p-8 bg-blue-600/10 border border-blue-500/20 rounded-3xl animate-pulse">
              <span className="text-3xl mb-3">🛰️</span>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Assigning Regional Pharmacy Rider...</p>
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-white/5 shrink-0">
        <div className="flex gap-2 bg-slate-950 p-2 rounded-full border border-white/5 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <input
            type="text"
            placeholder="Describe symptoms for AI analysis..."
            className="flex-1 bg-transparent px-5 text-sm text-slate-200 focus:outline-none placeholder:text-slate-600"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-blue-600 text-white p-3.5 rounded-full shadow-xl disabled:opacity-50 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthModule;