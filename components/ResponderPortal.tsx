
import React, { useEffect, useState, useRef } from 'react';
import { EmergencyEvent, Location } from '../types';
import LiveTrackingMap from './LiveTrackingMap';
import { generateEmergencySpeech } from '../services/geminiService';

interface ResponderPortalProps {
  event: EmergencyEvent;
  onClose: () => void;
}

// Function to calculate distance between two coordinates in KM
const calculateDistance = (loc1: Location, loc2: Location) => {
  const R = 6371; // Earth radius in KM
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const ResponderPortal: React.FC<ResponderPortalProps> = ({ event, onClose }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callAnswered, setCallAnswered] = useState(false);
  
  // Start responder 1km away for demo
  const [responderPos, setResponderPos] = useState<Location>({
    lat: event?.location?.lat ? event.location.lat + 0.009 : 0,
    lng: event?.location?.lng ? event.location.lng + 0.009 : 0
  });
  
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCalling(true);
      setTimeout(() => {
        handleAnswerCall();
      }, 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnswerCall = async () => {
    if (!event) return;
    setCallAnswered(true);
    
    const locationStr = `Latitude ${event.location.lat.toFixed(4)}, Longitude ${event.location.lng.toFixed(4)}`;
    const audioData = await generateEmergencySpeech({
      type: event.type,
      location: locationStr,
      severity: event.severity
    });

    if (audioData && audioData !== "AUDIO_GENERATED_MOCK") {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const decoded = atob(audioData);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channel[i] = dataInt16[i] / 32768.0;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => {
        setTimeout(() => {
          setIsCalling(false);
          setCallAnswered(false);
        }, 1500);
      };
    } else {
      setTimeout(() => {
        setIsCalling(false);
        setCallAnswered(false);
      }, 4000);
    }
  };

  useEffect(() => {
    if (!event?.location) return;
    
    const moveInterval = setInterval(() => {
      setResponderPos(prev => {
        const latDiff = (event.location.lat - prev.lat);
        const lngDiff = (event.location.lng - prev.lng);
        const dist = calculateDistance(prev, event.location);
        
        // Speed simulation: move 10% closer each step
        const step = 0.1;
        
        if (dist < 0.01) {
          clearInterval(moveInterval);
          return event.location;
        }
        
        return { 
          lat: prev.lat + latDiff * step, 
          lng: prev.lng + lngDiff * step 
        };
      });
    }, 1500);
    
    return () => clearInterval(moveInterval);
  }, [event?.location]);

  useEffect(() => {
    if (event?.location && responderPos) {
      const d = calculateDistance(responderPos, event.location);
      setDistance(d);
      // Assume 40km/h average speed for ETA
      setEta(Math.ceil((d / 40) * 60)); 
    }
  }, [responderPos, event?.location]);

  if (!event) return <div className="h-full bg-slate-950 flex items-center justify-center text-white">Initializing...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-white relative font-['Inter']">
      {/* Voice Agent Interaction Overlay */}
      {isCalling && (
        <div className="absolute inset-0 z-[5000] bg-slate-900/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-12">
             <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-40 animate-pulse"></div>
             <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.4)] relative border-4 border-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </div>
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">AI DISPATCH CALL</h2>
          <p className="text-blue-400 mb-10 uppercase tracking-[0.4em] text-xs font-black">
            {callAnswered ? "Connected to Server" : "Establishing Secure Voice Bridge..."}
          </p>
          {!callAnswered ? (
            <div className="flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Auto-Answering Call...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex gap-1.5 mb-6 h-12 items-center">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-2 bg-blue-500 rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
              <p className="text-blue-400 font-black uppercase tracking-widest text-sm mb-2">AI Agent Transmitting</p>
              <p className="text-slate-500 text-xs italic">Relaying satellite telemetry and severity data...</p>
            </div>
          )}
        </div>
      )}

      {/* Responder Interface Header */}
      <div className="p-5 bg-[#11141b] border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="font-black text-lg text-white leading-none tracking-tight">RESPONDER PORTAL</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live Telemetry Feed</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Map & Data Section */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden bg-[#0a0c10]">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#11141b] p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Distance Left</p>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-black text-2xl tracking-tighter">
                {distance.toFixed(2)}
              </span>
              <span className="text-blue-500 text-xs font-black uppercase">KM</span>
            </div>
          </div>
          <div className="bg-[#11141b] p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Estimated Arrival</p>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-black text-2xl tracking-tighter">
                {eta > 0 ? eta : '0'}
              </span>
              <span className="text-red-500 text-xs font-black uppercase">MIN</span>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative">
          <LiveTrackingMap 
            accidentLocation={event.location} 
            responderLocation={responderPos} 
            isTracking={true} 
          />
        </div>

        <div className="bg-[#11141b] p-6 rounded-3xl border border-slate-800 shrink-0">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Tactical Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0c10] p-4 rounded-2xl border border-slate-800/50">
               <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${distance < 0.05 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className={`font-black uppercase text-xs ${distance < 0.05 ? 'text-green-500' : 'text-red-500'}`}>
                   {distance < 0.05 ? 'ARRIVED' : 'EN ROUTE'}
                 </span>
               </div>
            </div>
            <div className="bg-[#0a0c10] p-4 rounded-2xl border border-slate-800/50">
               <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Unit ID</p>
               <p className="text-white font-mono text-xs font-black uppercase">AMB-09-TACTICAL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderPortal;
