import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Check, X, Loader2, AlertTriangle, Search, LocateFixed } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const GEOAPIFY_API_KEY = "7aa08a8dfa7c401fbdf3fb69f7f06ca7";

interface LocationPickerProps {
  onConfirm: (address: string) => void;
  onCancel: () => void;
  initialLocation?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onConfirm, onCancel, initialLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  const initMap = async () => {
    try {
      if (!(window as any).L) { setError("Map Module not loaded."); setLoading(false); return; }
      const L = (window as any).L;
      // Default to Center of India
      const defaultLat = 20.5937, defaultLng = 78.9629;
      
      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([defaultLat, defaultLng], 5);
      mapInstanceRef.current = map;
      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileLayer = L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
        attribution: 'Powered by Geoapify', maxZoom: 20, id: 'osm-bright',
      });
      tileLayer.addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #000080; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      });

      const marker = L.marker([defaultLat, defaultLng], { icon: customIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      const updateLoc = (lat: number, lng: number) => { setSelectedAddress("Identifying..."); fetchAddress(lat, lng); };
      
      map.on('click', (e: any) => { marker.setLatLng(e.latlng); updateLoc(e.latlng.lat, e.latlng.lng); });
      marker.on('dragend', (e: any) => { const { lat, lng } = marker.getLatLng(); updateLoc(lat, lng); });

      // Ensure tiles render immediately
      map.whenReady(() => {
          setTimeout(() => { map.invalidateSize(); }, 100);
      });

      // Async location resolution (does not block initial render)
      let locResolved = false;
      if (initialLocation && initialLocation !== "Unknown Location") {
          try {
              const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(initialLocation)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`);
              const data = await res.json();
              if (data.features?.length > 0) {
                  const { lat, lon, formatted } = data.features[0].properties;
                  map.setView([lat, lon], 16); marker.setLatLng([lat, lon]);
                  setSelectedAddress(formatted || initialLocation); locResolved = true;
              }
          } catch {}
      }

      if (!locResolved && navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            map.flyTo([latitude, longitude], 16); 
            marker.setLatLng([latitude, longitude]);
            updateLoc(latitude, longitude); 
            setLoading(false);
         }, (err) => {
            console.warn("Geolocation failed", err);
            setLoading(false);
         }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
         });
      } else {
        setLoading(false);
      }

    } catch { setError("Map Init Failed"); setLoading(false); }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`);
      const data = await res.json();
      if (data.features?.length > 0) setSelectedAddress(data.features[0].properties.formatted);
      else setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch { setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); if (!searchQuery.trim()) return; setIsSearching(true);
    try {
        const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`);
        const data = await res.json();
        if (data.features?.length > 0) {
            const { lat, lon, formatted } = data.features[0].properties;
            mapInstanceRef.current?.setView([lat, lon], 16); markerRef.current?.setLatLng([lat, lon]);
            setSelectedAddress(formatted);
        } else alert("Location not found");
    } catch {} finally { setIsSearching(false); }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return; setLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 16); markerRef.current?.setLatLng([latitude, longitude]);
        fetchAddress(latitude, longitude); setLoading(false);
    }, () => setLoading(false), {
       enableHighAccuracy: true
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-2 text-india-navy">
              <MapPin className="w-5 h-5" />
              <h3 className="font-bold text-slate-800">{t('select_coordinates')}</h3>
           </div>
           <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-grow relative bg-slate-100">
           {loading && !error && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80"><Loader2 className="w-8 h-8 animate-spin text-india-navy mb-2" /><span className="text-xs font-bold text-slate-500">{t('locating')}</span></div>}
           {error ? <div className="absolute inset-0 flex items-center justify-center text-red-600 font-bold bg-slate-100">{error}</div> : (
             <>
               <div ref={mapContainerRef} className="w-full h-full z-0" />
               <div className="absolute top-4 left-4 z-[400] w-64 max-w-[calc(100%-80px)]">
                    <form onSubmit={handleSearch} className="relative shadow-md rounded-lg">
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search_address')} className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-india-navy text-sm bg-white" />
                        <button type="submit" disabled={isSearching} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-india-navy">{isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button>
                    </form>
               </div>
             </>
           )}
           {!error && (
             <button onClick={handleCurrentLocation} className="absolute bottom-4 right-4 p-3 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-india-navy hover:shadow-lg transition-all z-[400]" title={t('my_location')}><LocateFixed className="w-5 h-5" /></button>
           )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-3">
           <div className="w-full text-sm font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200 truncate">
             {selectedAddress || "Select a point on the map..."}
           </div>
           <button onClick={() => onConfirm(selectedAddress)} disabled={!selectedAddress} className="w-full px-6 py-3 bg-india-navy hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm uppercase rounded shadow-md flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> {t('confirm_location')}
           </button>
        </div>

      </div>
    </div>
  );
};
