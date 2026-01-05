
import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types';

declare const L: any;

interface LiveTrackingMapProps {
  accidentLocation: Location;
  responderLocation: Location;
  isTracking: boolean;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ accidentLocation, responderLocation, isTracking }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const accidentMarkerRef = useRef<any>(null);
  const responderMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [distance, setDistance] = useState<string>('Calculating...');

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([accidentLocation.lat, accidentLocation.lng], 15);
      
      L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      const redIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:#dc2626; width:24px; height:24px; border-radius:50%; border:4px solid white; box-shadow: 0 0 15px rgba(220,38,38,0.5);'></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const ambulanceIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='font-size:32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));'>🚑</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      accidentMarkerRef.current = L.marker([accidentLocation.lat, accidentLocation.lng], { icon: redIcon })
        .addTo(mapRef.current)
        .bindPopup('<b style="color:#dc2626">Incident Site</b>')
        .openPopup();

      responderMarkerRef.current = L.marker([responderLocation.lat, responderLocation.lng], { icon: ambulanceIcon })
        .addTo(mapRef.current)
        .bindPopup('<b>Emergency Unit</b>');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && isTracking) {
      responderMarkerRef.current.setLatLng([responderLocation.lat, responderLocation.lng]);
      
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([
          [accidentLocation.lat, accidentLocation.lng],
          [responderLocation.lat, responderLocation.lng]
        ]);
      } else {
        polylineRef.current = L.polyline([
          [accidentLocation.lat, accidentLocation.lng],
          [responderLocation.lat, responderLocation.lng]
        ], { color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '1, 10' }).addTo(mapRef.current);
      }

      // Calculate distance (very simplified haversine-ish or just linear for demo)
      const d = mapRef.current.distance([accidentLocation.lat, accidentLocation.lng], [responderLocation.lat, responderLocation.lng]);
      setDistance((d / 1000).toFixed(2) + ' km');

      const group = L.featureGroup([accidentMarkerRef.current, responderMarkerRef.current]);
      mapRef.current.fitBounds(group.getBounds().pad(0.3));
    }
  }, [responderLocation, isTracking]);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 relative group">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* HUD Overlays */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-[1000] pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 pointer-events-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Arrival</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">~{Math.max(1, Math.round(parseFloat(distance) * 1.5))}</span>
            <span className="text-xs font-bold text-slate-400">MINS</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance to Target</p>
          <p className="text-xl font-black text-slate-900">{distance}</p>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Incident Live</span>
         </div>
         <div className="w-px h-4 bg-slate-200"></div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Responder Tracked</span>
         </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
