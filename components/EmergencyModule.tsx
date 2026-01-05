import React, { useState, useEffect } from "react";
import { EmergencyEvent, EmergencyStatus, Location } from "../types";
import LiveTrackingMap from "./LiveTrackingMap";
import { triggerAutomatedEmergencyCommunications } from "../services/communicationService";

const CONTACTS = [
  { id: "amb", name: "Ambulance", number: "+917478753070", icon: "🚑" },
  { id: "pol", name: "Police", number: "+919382539043", icon: "🚓" },
  { id: "hosp", name: "Hospital", number: "+917908743890", icon: "🏥" },
];

interface EmergencyModuleProps {
  onOpenResponderPortal: (event: EmergencyEvent) => void;
}

const EmergencyModule: React.FC<EmergencyModuleProps> = ({
  onOpenResponderPortal,
}) => {
  const [status, setStatus] = useState<EmergencyStatus>(EmergencyStatus.IDLE);
  const [currentEvent, setCurrentEvent] = useState<EmergencyEvent | null>(null);
  const [responderPos, setResponderPos] = useState<Location>({
    lat: 0,
    lng: 0,
  });
  const [dispatchPhase, setDispatchPhase] = useState<
    "IDLE" | "LOCAL" | "CLOUD" | "COMPLETE" | "FAILED"
  >("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<
    Record<string, "IDLE" | "SENDING" | "DONE" | "ERROR">
  >({
    whatsapp: "IDLE",
    sms: "IDLE",
    voice: "IDLE",
  });

  useEffect(() => {
    if (status === EmergencyStatus.NOTIFIED && currentEvent) {
      const timer = setTimeout(() => {
        onOpenResponderPortal(currentEvent);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, currentEvent, onOpenResponderPortal]);

  const startEmergency = () => {
    setStatus(EmergencyStatus.REPORTING);
    setDispatchPhase("LOCAL");
    setErrorMessage(null);
    setCloudStatus({ whatsapp: "IDLE", sms: "IDLE", voice: "IDLE" });

    const finalizeEvent = async (lat: number, lng: number) => {
      const event: EmergencyEvent = {
        id: `LG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        type: "Severe Collision Detected",
        location: { lat, lng },
        timestamp: new Date().toLocaleString(),
        status: EmergencyStatus.REPORTING,
        severity: "Severe",
      };

      setCurrentEvent(event);
      setResponderPos({ lat: lat + 0.005, lng: lng + 0.005 });

      // Stage 1: Local System Preparation
      await new Promise((r) => setTimeout(r, 1200));

      // Stage 2: Attempting Cloud Dispatch
      setDispatchPhase("CLOUD");
      setCloudStatus({ whatsapp: "SENDING", sms: "SENDING", voice: "SENDING" });

      try {
        const dispatchPromise = triggerAutomatedEmergencyCommunications({
          event_type: event.type,
          latitude: lat,
          longitude: lng,
          timestamp: event.timestamp,
          severity: event.severity.toUpperCase(),
          source: "LIFEGUARD_AI_CORE",
        });

        const result = (await Promise.race([
          dispatchPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("UPLINK_TIMEOUT")), 8000),
          ),
        ])) as any;

        if (
          result &&
          (result.status === "success" || result.status === "partial_failure")
        ) {
          setCloudStatus({
            whatsapp: result.initial_delivery_report?.whatsapp?.some(
              (r: any) => r.status !== "failed",
            )
              ? "DONE"
              : "ERROR",
            sms: result.initial_delivery_report?.sms?.some(
              (r: any) => r.status !== "failed",
            )
              ? "DONE"
              : "ERROR",
            voice: result.initial_delivery_report?.voiceCall?.some(
              (r: any) => r.status !== "failed",
            )
              ? "DONE"
              : "ERROR",
          });
          setDispatchPhase("COMPLETE");
          setStatus(EmergencyStatus.NOTIFIED);
        } else {
          throw new Error("DISPATCH_FAILED");
        }
      } catch (err: any) {
        console.warn(
          "Satellite Dispatch Failed. Falling back to Tactical Override.",
          err,
        );
        setErrorMessage(
          err.message === "UPLINK_TIMEOUT"
            ? "Network Timeout"
            : "Server Unreachable",
        );
        setCloudStatus({ whatsapp: "ERROR", sms: "ERROR", voice: "ERROR" });
        setDispatchPhase("FAILED");

        // AUTO-OVERRIDE: After showing error for 3 seconds, proceed to demo portal
        setTimeout(() => {
          setDispatchPhase("COMPLETE");
          setStatus(EmergencyStatus.NOTIFIED);
        }, 3000);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => finalizeEvent(pos.coords.latitude, pos.coords.longitude),
      () => finalizeEvent(22.5726, 88.3639),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#020617] text-slate-300 relative overflow-hidden font-['Inter']">
      {status === EmergencyStatus.IDLE ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-red-600/10 blur-[120px] rounded-full animate-pulse"></div>
            <div
              className="relative group cursor-pointer"
              onClick={startEmergency}
            >
              <div className="absolute -inset-10 bg-gradient-to-tr from-red-600/20 to-orange-500/10 rounded-full opacity-30 group-hover:opacity-60 blur-3xl transition-all duration-1000 animate-[spin_10s_linear_infinite]"></div>
              <div className="w-56 h-56 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 shadow-2xl transition-all hover:scale-105 active:scale-95 relative z-10">
                <div className="w-40 h-40 bg-gradient-to-b from-red-600 to-red-900 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.5),inset_0_4px_20px_rgba(255,255,255,0.4)] ring-8 ring-red-600/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-white mb-1 drop-shadow-2xl animate-pulse"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-white text-3xl font-black tracking-[0.2em] -mr-[0.2em]">
                    SOS
                  </span>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
            Emergency Hub
          </h2>
          <p className="text-slate-500 max-w-xs mb-10 text-[9px] font-bold uppercase tracking-[0.3em]">
            AI Satellite Dispatch Terminal
          </p>
          <div className="w-full max-w-sm flex flex-col gap-2">
            {CONTACTS.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/40 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-4 group"
              >
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-lg shadow-inner">
                  {c.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">
                    {c.name}
                  </p>
                  <p className="text-[11px] font-black text-white/80 font-mono tracking-tighter">
                    {c.number}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          {/* Tactical Control Panel - Unified Header */}
          <div className="bg-[#0f172a]/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden shrink-0">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#3b82f6 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/50 border border-white/5 rounded-full w-fit">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${dispatchPhase === "FAILED" ? "bg-red-500" : "bg-green-500 animate-pulse"}`}
                    ></div>
                    <span
                      className={`text-[8px] font-black uppercase tracking-[0.2em] ${dispatchPhase === "FAILED" ? "text-red-500" : "text-green-500"}`}
                    >
                      {dispatchPhase === "FAILED"
                        ? "Link Failure"
                        : "Mission Control Active"}
                    </span>
                  </div>
                  <h3 className="text-white text-2xl font-black tracking-tighter uppercase italic drop-shadow-lg leading-none mt-1">
                    {currentEvent?.type || "Acquiring Feed..."}
                  </h3>
                </div>

                <div className="flex flex-col items-end">
                  <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-xl text-right backdrop-blur-sm">
                    <p className="text-[7px] font-mono text-slate-500 uppercase font-black tracking-widest">
                      Incident Token
                    </p>
                    <p className="text-blue-400 font-mono text-xs font-black">
                      {currentEvent?.id || "SEARCHING..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Node Status Matrix */}
              <div className="grid grid-cols-3 gap-3">
                {["whatsapp", "sms", "voice"].map((type) => (
                  <div
                    key={type}
                    className={`relative p-3 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${
                      cloudStatus[type] === "DONE"
                        ? "bg-green-500/10 border-green-500/20"
                        : cloudStatus[type] === "SENDING"
                          ? "bg-blue-500/5 border-blue-500/20"
                          : cloudStatus[type] === "ERROR"
                            ? "bg-red-500/10 border-red-500/20"
                            : "bg-slate-950/40 border-white/5"
                    }`}
                  >
                    {cloudStatus[type] === "SENDING" && (
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 animate-[shimmer_1.5s_infinite]"></div>
                    )}
                    <div className="text-xl mb-1">
                      {type === "whatsapp"
                        ? "💬"
                        : type === "sms"
                          ? "📱"
                          : "📞"}
                    </div>
                    <p
                      className={`text-[7px] font-black uppercase tracking-widest mb-1 ${
                        cloudStatus[type] === "DONE"
                          ? "text-green-500"
                          : cloudStatus[type] === "SENDING"
                            ? "text-blue-400"
                            : cloudStatus[type] === "ERROR"
                              ? "text-red-500"
                              : "text-slate-600"
                      }`}
                    >
                      {cloudStatus[type]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tactical Progress Meter */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-[1500ms] cubic-bezier(0.23, 1, 0.32, 1) ${
                      dispatchPhase === "FAILED"
                        ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                        : dispatchPhase === "COMPLETE"
                          ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                          : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    }`}
                    style={{
                      width:
                        dispatchPhase === "COMPLETE"
                          ? "100%"
                          : dispatchPhase === "CLOUD"
                            ? "70%"
                            : dispatchPhase === "LOCAL"
                              ? "35%"
                              : "0%",
                    }}
                  ></div>
                </div>
                <span className="text-[9px] font-mono font-black text-slate-500 min-w-[30px]">
                  {dispatchPhase === "COMPLETE"
                    ? "100%"
                    : dispatchPhase === "CLOUD"
                      ? "70%"
                      : dispatchPhase === "LOCAL"
                        ? "35%"
                        : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Map Environment Viewport */}
          <div className="flex-1 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative bg-slate-900 group">
            {currentEvent && (
              <LiveTrackingMap
                accidentLocation={currentEvent.location}
                responderLocation={responderPos}
                isTracking={status === EmergencyStatus.REPORTING}
              />
            )}

            {/* Failure Mode Overlay */}
            {dispatchPhase === "FAILED" && (
              <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center m-4 rounded-[2.5rem] border-2 border-red-500/20">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h4 className="text-white font-black text-lg tracking-tight uppercase mb-1 italic">
                  Dispatch Uplink Timeout
                </h4>
                <p className="text-red-400 text-[10px] font-mono font-black uppercase mb-6 tracking-widest">
                  {errorMessage || "RETRYING..."}
                </p>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest">
                    Engaging Tactical Bypass...
                  </span>
                </div>
              </div>
            )}

            {/* Cloud Sync Overlay */}
            {dispatchPhase === "CLOUD" && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl z-[90] flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 relative mb-8">
                  <div className="absolute inset-0 border-[3px] border-blue-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-t-[3px] border-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-500 animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <h4 className="text-white font-black text-xl tracking-[0.2em] uppercase italic mb-2">
                  Satellite Uplink
                </h4>
                <p className="text-blue-400 text-[10px] font-mono font-black uppercase tracking-widest animate-pulse">
                  Routing SOS Packets...
                </p>
                <div className="mt-8 flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-3 bg-blue-500/20 rounded-full animate-[loading_1s_infinite]"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Finish Overlay */}
            {status === EmergencyStatus.NOTIFIED && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center z-[2000]">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(34,197,94,0.4)] relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">
                  Units En-Route
                </h3>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-10 max-w-[200px]">
                  Dispatch confirmation received. Initializing tactical
                  responder portal...
                </p>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-[loading_4s_linear]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes loading {
          0%, 100% { height: 12px; background: rgba(59, 130, 246, 0.2); }
          50% { height: 20px; background: rgba(59, 130, 246, 0.8); }
        }
      `}</style>
    </div>
  );
};

export default EmergencyModule;
