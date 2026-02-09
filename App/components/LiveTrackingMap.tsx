import React, { useEffect, useRef, useState } from 'react';
import { Location, EmergencyFacility } from '../types';

declare const L: any;

interface LiveTrackingMapProps {
  accidentLocation: Location;
  responderLocation: Location;
  isTracking: boolean;
  staticView?: boolean;
  facilities?: EmergencyFacility[];
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ accidentLocation, responderLocation, isTracking, staticView, facilities }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const layerRefs = useRef<{ [key: string]: any }>({});
  const [distance, setDistance] = useState<string>('---');

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { 
        zoomControl: false,
        attributionControl: false
      }).setView([accidentLocation.lat, accidentLocation.lng], 16);
      
      // High-detail Tactical Dark Mode
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);

      // Add Hazard Perimeter (Circle)
      layerRefs.current.perimeter = L.circle([accidentLocation.lat, accidentLocation.lng], {
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.15,
        radius: 150,
        weight: 1,
        dashArray: '5, 10'
      }).addTo(mapRef.current);

      // Pulse Animation for Incident Site
      const redIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative">
            <div class="absolute -inset-8 bg-red-600/20 rounded-full animate-ping"></div>
            <div class="absolute -inset-4 bg-red-600/40 rounded-full animate-pulse"></div>
            <div style='background-color:#dc2626; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow: 0 0 30px rgba(220,38,38,1); z-index: 10;'></div>
          </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      markersRef.current.accident = L.marker([accidentLocation.lat, accidentLocation.lng], { icon: redIcon })
        .addTo(mapRef.current)
        .bindPopup('<b style="color:#dc2626; font-size: 10px; font-weight: 900;">ACCIDENT SITE (LAT: ' + accidentLocation.lat.toFixed(6) + ')</b>');

      if (!staticView) {
        const ambulanceIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style='font-size:36px; filter: drop-shadow(0 0 10px rgba(59,130,246,0.8));' class="animate-bounce">🚑</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        markersRef.current.responder = L.marker([responderLocation.lat, responderLocation.lng], { icon: ambulanceIcon })
          .addTo(mapRef.current);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Facility Markers
  useEffect(() => {
    if (!mapRef.current || !facilities) return;
    
    facilities.forEach((f, idx) => {
      const key = `facility-${idx}`;
      if (!markersRef.current[key]) {
        const icon = L.divIcon({
          className: 'facility-icon',
          html: `<div class="bg-slate-900 border border-white/20 p-2 rounded-full shadow-2xl flex items-center justify-center text-sm ring-2 ring-white/5 backdrop-blur-md">${f.type === 'Hospital' ? '🏥' : f.type === 'Police' ? '🚓' : '🚑'}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
        markersRef.current[key] = L.marker([f.location.lat, f.location.lng], { icon }).addTo(mapRef.current)
          .bindPopup(`<div class="p-2 bg-slate-900 text-white rounded-lg"><b class="text-[9px] uppercase tracking-widest text-blue-400">${f.name}</b><p class="text-[8px] text-slate-400 font-bold uppercase mt-1">${f.type} Unit Identified</p></div>`);
      }
    });
  }, [facilities]);

  useEffect(() => {
    if (mapRef.current && isTracking && markersRef.current.responder) {
      markersRef.current.responder.setLatLng([responderLocation.lat, responderLocation.lng]);
      
      if (layerRefs.current.route) {
        const path = layerRefs.current.route.getLatLngs();
        path.push([responderLocation.lat, responderLocation.lng]);
        layerRefs.current.route.setLatLngs(path);
      } else {
        layerRefs.current.route = L.polyline([
          [accidentLocation.lat, accidentLocation.lng],
          [responderLocation.lat, responderLocation.lng]
        ], { color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '10, 15' }).addTo(mapRef.current);
      }

      const d = mapRef.current.distance([accidentLocation.lat, accidentLocation.lng], [responderLocation.lat, responderLocation.lng]);
      setDistance((d / 1000).toFixed(2) + ' km');

      const bounds = L.latLngBounds([accidentLocation.lat, accidentLocation.lng], [responderLocation.lat, responderLocation.lng]);
      mapRef.current.fitBounds(bounds.pad(0.4), { animate: true });
    }
  }, [responderLocation, isTracking]);

  return (
    <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl relative bg-[#020617]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Tactical HUD Overlays - POINT-TO-POINT DETAILS */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
          <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2 italic">Coordinate Feed</p>
          <div className="font-mono text-[10px] text-white space-y-1">
            <p><span className="text-slate-500">LAT:</span> {accidentLocation.lat.toFixed(6)}</p>
            <p><span className="text-slate-500">LNG:</span> {accidentLocation.lng.toFixed(6)}</p>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 z-[900] bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.3)_100%)]"></div>
      
      {staticView && (
        <div className="absolute top-6 right-6 z-[1000] flex flex-col items-end gap-3">
           <div className="bg-slate-950/90 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">SATELLITE SYNC</span>
                <span className="text-[11px] font-black text-white uppercase italic tracking-tighter">LIVE FEED ACTIVE</span>
              </div>
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
           </div>
           
           <div className="bg-red-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-red-500/30">
             <span className="text-[9px] font-black text-red-200 uppercase tracking-[0.3em] italic">HAZARD PERIMETER: 150M</span>
           </div>
        </div>
      )}

      {!staticView && isTracking && (
        <div className="absolute bottom-8 left-6 right-6 flex justify-between items-end z-[1000] pointer-events-none">
          <div className="bg-slate-950/95 backdrop-blur-2xl px-6 py-5 rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">ETA Analysis</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white italic">{Math.max(1, Math.round(parseFloat(distance) * 2.5))}</span>
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Mins</span>
            </div>
          </div>
          <div className="bg-slate-950/95 backdrop-blur-2xl px-6 py-5 rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto text-right">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.4em] mb-2">Gap Distance</p>
            <p className="text-3xl font-black text-white italic">{distance}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;