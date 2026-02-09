import React, { useEffect, useState, useRef } from 'react';
import { EmergencyEvent, Location, EmergencyFacility } from '../types';
import LiveTrackingMap from './LiveTrackingMap';
import { generateEmergencySpeech } from '../services/geminiService';

interface ResponderPortalProps {
  event: EmergencyEvent;
  onClose: () => void;
}

const ResponderPortal: React.FC<ResponderPortalProps> = ({ event, onClose }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callAnswered, setCallAnswered] = useState(false);
  const [primaryResponder, setPrimaryResponder] = useState<EmergencyFacility | null>(null);
  const [responderPos, setResponderPos] = useState<Location>({ lat: 0, lng: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (event.nearestFacilities && event.nearestFacilities.length > 0) {
      const hospital = event.nearestFacilities.find(f => f.type === 'Hospital') || event.nearestFacilities[0];
      setPrimaryResponder(hospital);
      setResponderPos(hospital.location);
    }

    const timer = setTimeout(() => {
      setIsCalling(true);
      setTimeout(() => handleAnswerCall(), 2500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [event]);

  // Fix: Manual base64 decoding following SDK guidelines
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Fix: Correct manual PCM decoding logic as per Gemini API documentation
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const handleAnswerCall = async () => {
    setCallAnswered(true);
    const audioData = await generateEmergencySpeech({
      type: event.type,
      location: `Coordinates ${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)}`,
      severity: event.severity,
      facilityName: primaryResponder?.name
    });

    if (audioData) {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      
      try {
        const bytes = decodeBase64(audioData);
        // Fix: Use the standard manual decoding for raw PCM audio from Gemini
        const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => {
          setTimeout(() => setIsCalling(false), 2000);
        };
      } catch (err) {
        console.error("Critical: Failed to decode or play emergency dispatch audio.", err);
        setIsCalling(false);
      }
    }
  };

  // Zomato-style path simulation
  useEffect(() => {
    if (!primaryResponder) return;
    const interval = setInterval(() => {
      setResponderPos(prev => {
        const dLat = (event.location.lat - prev.lat) * 0.1;
        const dLng = (event.location.lng - prev.lng) * 0.1;
        if (Math.abs(dLat) < 0.0001 && Math.abs(dLng) < 0.0001) {
          clearInterval(interval);
          return event.location;
        }
        // Add slight "organic" noise to simulate road turns
        return { 
          lat: prev.lat + dLat + (Math.random() - 0.5) * 0.0002, 
          lng: prev.lng + dLng + (Math.random() - 0.5) * 0.0002
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [primaryResponder, event.location]);

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-white relative">
      {isCalling && (
        <div className="absolute inset-0 z-[5000] bg-slate-900/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
           <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center animate-pulse border-8 border-blue-400 shadow-[0_0_100px_rgba(37,99,235,0.5)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
           </div>
           <h2 className="text-4xl font-black mt-12 mb-2 italic tracking-tighter">AI DISPATCH BRIDGE</h2>
           <p className="text-blue-400 font-mono text-[10px] tracking-[0.5em] uppercase font-black">
             {callAnswered ? "Transmitting Telemetry" : "Connecting Secure Voice Link..."}
           </p>
        </div>
      )}

      <div className="p-6 bg-[#11141b] border-b border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tighter italic">MISSION CONTROL</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active Incident: {event.id}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[#11141b] p-5 rounded-3xl border border-slate-800 shadow-lg">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Assigned Facility</p>
              <p className="text-white font-black text-sm uppercase truncate">{primaryResponder?.name || "Searching..."}</p>
           </div>
           <div className="bg-red-600/10 p-5 rounded-3xl border border-red-600/30 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-red-500 uppercase mb-1">Status</p>
                <p className="text-red-500 font-black text-sm italic uppercase tracking-tighter">Emergency Dispatch</p>
              </div>
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
           </div>
        </div>

        <div className="flex-1 rounded-[3rem] overflow-hidden border border-slate-800 relative">
           <LiveTrackingMap 
             accidentLocation={event.location} 
             responderLocation={responderPos} 
             isTracking={true} 
           />
           {/* Custom Overlay for Facilities */}
           <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
              {event.nearestFacilities?.map((f, i) => (
                <div key={i} className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-slate-200">
                   <span className="text-xs">{f.type === 'Hospital' ? '🏥' : f.type === 'Police' ? '🚓' : '🚑'}</span>
                   <span className="text-[9px] font-black text-slate-800 uppercase">{f.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderPortal;