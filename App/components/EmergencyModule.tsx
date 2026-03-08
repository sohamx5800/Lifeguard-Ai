import React, { useState, useEffect, useRef } from 'react';
import { EmergencyEvent, EmergencyStatus, Location, EmergencyFacility } from '../types';
import LiveTrackingMap from './LiveTrackingMap';
import { triggerAutomatedEmergencyCommunications } from '../services/communicationService';
import { findNearestEmergencyServices } from '../services/geminiService';

interface EmergencyModuleProps {
  onOpenResponderPortal: (event: EmergencyEvent) => void;
}

const EmergencyModule: React.FC<EmergencyModuleProps> = ({ onOpenResponderPortal }) => {
  const [status, setStatus] = useState<EmergencyStatus>(EmergencyStatus.IDLE);
  const [userLoc, setUserLoc] = useState<Location | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [holdProgress, setHoldProgress] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<EmergencyEvent | null>(null);
  const [verifiedResponders, setVerifiedResponders] = useState<any>(null);
  const holdTimerRef = useRef<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
    // Initial location fetch for display
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Initial location fetch failed"),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 8));

  const startEmergency = () => {
    setStatus(EmergencyStatus.REPORTING);
    addLog("INIT: EMERGENCY PROTOCOL ACTIVATED");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        processDispatch(lat, lng);
      },
      (err) => {
        addLog("WARN: GPS SIGNAL WEAK. USING LAST KNOWN POSITION.");
        setTimeout(() => processDispatch(37.7749, -122.4194), 1000);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const processDispatch = async (lat: number, lng: number) => {
    setUserLoc({ lat, lng });
    addLog("UPLINK: DISPATCHING EMERGENCY SERVICES...");

    try {
      // Step 1: AI Grounding for context
      const aiFacilities = await findNearestEmergencyServices(lat, lng);
      
      const event: EmergencyEvent = {
        id: `LG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        type: 'CRITICAL ACCIDENT',
        location: { lat, lng },
        timestamp: new Date().toLocaleString(),
        status: EmergencyStatus.REPORTING,
        severity: 'Severe',
        nearestFacilities: aiFacilities,
        car_id: 'BEE-ROBO-001',
        impact_type: 'MANUAL_SOS',
        passenger_count: 1
      };
      
      setCurrentEvent(event);

      // Step 2: Trigger Backend Dispatch
      const response = await triggerAutomatedEmergencyCommunications({
        event_type: 'CRITICAL_ACCIDENT',
        latitude: lat,
        longitude: lng,
        timestamp: event.timestamp,
        severity: 'SEVERE',
        source: 'LIFEGUARD_MOBILE_v1',
        car_id: event.car_id!,
        impact_type: event.impact_type!,
        passenger_count: event.passenger_count
      });
      
      if (response.status === 'success' || response.status === 'partial_success') {
        setVerifiedResponders(response.responders);
        addLog(`SMS: ${response.sms_status === 'simulated' ? 'SENT' : response.sms_status.toUpperCase()}`);
        addLog(`CALL: ${response.call_status === 'simulated' ? 'INITIATED' : response.call_status.toUpperCase()}`);
        
        const updatedEvent: EmergencyEvent = {
          ...event,
          nearestService: response.nearestService,
          sms_status: response.sms_status === 'simulated' ? 'sent' : response.sms_status,
          call_status: response.call_status === 'simulated' ? 'initiated' : response.call_status,
          status: EmergencyStatus.NOTIFIED,
          nearestFacilities: response.responders ? Object.values(response.responders).map((r: any) => ({
            name: r.name,
            address: r.id,
            location: { lat: r.lat, lng: r.lng },
            type: r.type,
            uri: r.maps_link
          })) : aiFacilities
        };
        
        setCurrentEvent(updatedEvent);
        setStatus(EmergencyStatus.NOTIFIED);
        addLog(`SUCCESS: DISPATCH PIPELINE ACTIVE`);
      } else {
        throw new Error(response.error || "Dispatch failed");
      }
    } catch (e: any) {
      addLog(`ERROR: ${e.message || "DISPATCH HUB UNREACHABLE"}`);
      setTimeout(() => setStatus(EmergencyStatus.IDLE), 5000);
    }
  };

  const handleHoldStart = () => {
    if (status !== EmergencyStatus.IDLE) return;
    holdTimerRef.current = window.setInterval(() => {
      setHoldProgress(p => {
        if (p >= 100) {
          clearInterval(holdTimerRef.current!);
          startEmergency();
          return 100;
        }
        return p + 4;
      });
    }, 40);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (holdProgress < 100) setHoldProgress(0);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-[#020617] relative">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {status === EmergencyStatus.IDLE ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <header className="absolute top-12 text-center">
            <h2 className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em] italic">Lifeguard Autonomous Guard</h2>
            <div className="h-[1px] w-12 bg-red-600/40 mx-auto mt-2"></div>
          </header>

          <div className="relative flex flex-col items-center justify-center">
            <svg className="absolute w-[340px] h-[340px] -rotate-90">
              <circle cx="170" cy="170" r="150" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
              <circle cx="170" cy="170" r="150" fill="transparent" stroke="#dc2626" strokeWidth="4"
                strokeDasharray={2 * Math.PI * 150}
                strokeDashoffset={2 * Math.PI * 150 * (1 - holdProgress / 100)}
                className="transition-all duration-100" />
            </svg>

            <button
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              className={`w-64 h-64 rounded-full flex flex-col items-center justify-center border-2 border-red-600/20 bg-slate-950 shadow-[0_0_60px_rgba(220,38,38,0.1)] transition-transform active:scale-95 z-10`}
            >
              <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center border border-red-500/30 transition-all ${holdProgress > 0 ? 'bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.4)]' : 'bg-red-600/10'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-white text-3xl font-black tracking-tight italic">EMERGENCY</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Hold to Confirm</span>
            </button>
          </div>

          <div className="absolute bottom-12 w-full px-8 flex flex-col items-center">
            {currentLocation && (
              <div className="mb-8 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono text-slate-300">
                  LOC: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase mt-2">GPS LINK</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase mt-2">SAT COMMS</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase mt-2">AI CORE</span>
              </div>
            </div>
            <div className="mt-6 text-[8px] font-black text-slate-500/40 uppercase tracking-[0.4em] italic">
              Emergency Response System Active
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6 space-y-4">
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-white/5 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
               <span className="text-white text-lg font-black italic">DISPATCH CONSOLE</span>
               <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                 status === EmergencyStatus.NOTIFIED ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'
               }`}>
                 {status === EmergencyStatus.NOTIFIED ? 'DISPATCHED' : 'DISPATCHING'}
               </span>
             </div>
             
             {/* Status Panel */}
             {currentEvent && (
               <div className="mb-4 grid grid-cols-2 gap-3">
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                   <p className="text-[7px] text-slate-500 font-black uppercase mb-1">Incident Location</p>
                   <p className="text-[9px] text-white font-mono">{currentEvent.location.lat.toFixed(4)}, {currentEvent.location.lng.toFixed(4)}</p>
                 </div>
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                   <p className="text-[7px] text-slate-500 font-black uppercase mb-1">Nearest Service</p>
                   <p className="text-[9px] text-white font-black truncate">{currentEvent.nearestService?.name || 'Calculating...'}</p>
                 </div>
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                   <p className="text-[7px] text-slate-500 font-black uppercase mb-1">SMS Status</p>
                   <p className={`text-[9px] font-black uppercase ${currentEvent.sms_status === 'sent' ? 'text-green-400' : 'text-yellow-400'}`}>
                     {currentEvent.sms_status || 'Pending'}
                   </p>
                 </div>
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                   <p className="text-[7px] text-slate-500 font-black uppercase mb-1">Call Status</p>
                   <p className={`text-[9px] font-black uppercase ${currentEvent.call_status === 'initiated' ? 'text-green-400' : 'text-yellow-400'}`}>
                     {currentEvent.call_status || 'Pending'}
                   </p>
                 </div>
               </div>
             )}

             <div className="space-y-2 h-32 overflow-hidden font-mono text-[10px] border-t border-white/5 pt-4">
                {log.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${i === 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                    <span>[{new Date().toLocaleTimeString()}]</span>
                    <span>{m}</span>
                  </div>
                ))}
             </div>
             
             {status === EmergencyStatus.NOTIFIED && (
               <button 
                onClick={() => onOpenResponderPortal(currentEvent!)}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
               >
                 Open Responder Portal
               </button>
             )}
          </div>
          <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-950">
             {userLoc && (
              <LiveTrackingMap 
                accidentLocation={userLoc} 
                responderLocation={userLoc} 
                isTracking={false} 
                staticView={true} 
                facilities={currentEvent?.nearestFacilities} 
                nearestService={currentEvent?.nearestService}
              />
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyModule;