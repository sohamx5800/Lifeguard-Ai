import React, { useEffect, useState, useRef } from 'react';
import { EmergencyEvent, Location, EmergencyFacility } from '../types';
import LiveTrackingMap from './LiveTrackingMap';
import { generateEmergencySpeech } from '../services/geminiService';

interface ResponderPortalProps {
  event: EmergencyEvent;
  onClose: () => void;
}

const ResponderPortal: React.FC<ResponderPortalProps> = ({ event, onClose }) => {
  const [primaryResponder, setPrimaryResponder] = useState<EmergencyFacility | null>(null);
  const [responderPos, setResponderPos] = useState<Location>({ lat: 0, lng: 0 });

  useEffect(() => {
    if (event.nearestService) {
      const service = {
        name: event.nearestService.name,
        address: event.nearestService.id,
        location: { lat: event.nearestService.lat, lng: event.nearestService.lng },
        type: event.nearestService.type as any
      };
      setPrimaryResponder(service);
      setResponderPos(service.location);
    } else if (event.nearestFacilities && event.nearestFacilities.length > 0) {
      const hospital = event.nearestFacilities.find(f => f.type === 'Hospital') || event.nearestFacilities[0];
      setPrimaryResponder(hospital);
      setResponderPos(hospital.location);
    }
  }, [event]);

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-white relative">
      <div className="p-6 bg-[#11141b] border-b border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tighter italic uppercase">Mission Control</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Incident Fixed: {event.id}</p>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[#11141b] p-5 rounded-[2rem] border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -mr-8 -mt-8 rounded-full"></div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Primary Responder</p>
              <p className="text-white font-black text-xs uppercase truncate italic">{primaryResponder?.name || "Assigning..."}</p>
              <div className="mt-2 flex gap-2">
                <span className={`text-[7px] px-2 py-0.5 rounded-full font-black uppercase ${event.sms_status === 'sent' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                  SMS: {event.sms_status || 'PENDING'}
                </span>
                <span className={`text-[7px] px-2 py-0.5 rounded-full font-black uppercase ${event.call_status === 'initiated' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                  CALL: {event.call_status || 'PENDING'}
                </span>
              </div>
           </div>
           <div className="bg-red-600/10 p-5 rounded-[2rem] border border-red-600/30 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[9px] font-black text-red-500 uppercase mb-1 tracking-widest">Tactical Status</p>
                <p className="text-red-500 font-black text-xs italic uppercase tracking-tighter underline underline-offset-2">En Route</p>
              </div>
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
           </div>
        </div>

        <div className="flex-1 rounded-[3rem] overflow-hidden border border-slate-800 relative bg-[#020617] shadow-2xl">
           <LiveTrackingMap 
             accidentLocation={event.location} 
             responderLocation={responderPos} 
             isTracking={true} 
           />
           <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2 max-w-[200px]">
              {event.nearestFacilities?.slice(0, 3).map((f, i) => (
                <div key={i} className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 animate-fade-in">
                   <span className="text-sm">{f.type === 'Hospital' ? '🏥' : f.type === 'Police' ? '🚓' : '🚑'}</span>
                   <div className="overflow-hidden">
                     <p className="text-[9px] font-black text-white uppercase truncate tracking-tighter">{f.name}</p>
                     <p className="text-[7px] text-slate-500 font-bold uppercase">{f.type} Unit Verified</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderPortal;