import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Check, X, Loader2, Search, LocateFixed, Navigation } from 'lucide-react';
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
  // Track if movement was triggered by code (search/suggestion) vs user interaction
  const isProgrammaticMove = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Suggestion State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { t } = useLanguage();

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Autocomplete Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        const fetchSuggestions = async () => {
          try {
            const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&apiKey=${GEOAPIFY_API_KEY}&limit=5`);
            const data = await res.json();
            if (data.features) {
              setSuggestions(data.features);
              setShowSuggestions(true);
            }
          } catch (e) {
            console.error("Autocomplete Error:", e);
          }
        };
        // Only fetch if the query doesn't match the selected address exactly (avoids reopen on selection)
        if (searchQuery !== selectedAddress) {
             fetchSuggestions();
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedAddress]);

  const initMap = async () => {
    try {
      if (!(window as any).L) { setError("Map Module not loaded."); setLoading(false); return; }
      const L = (window as any).L;
      // Default to Center of India
      const defaultLat = 20.5937, defaultLng = 78.9629;
      
      const map = L.map(mapContainerRef.current, { 
          zoomControl: false,
          fadeAnimation: true,
          zoomAnimation: true
      }).setView([defaultLat, defaultLng], 5);
      
      mapInstanceRef.current = map;
      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileLayer = L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
        attribution: 'Powered by Geoapify', maxZoom: 20, id: 'osm-bright',
      });
      tileLayer.addTo(map);

      // Event: Moving (Dragging/Zooming)
      map.on('movestart', () => {
         if (!isProgrammaticMove.current) {
            setSelectedAddress(t('locating'));
         }
      });

      // Event: Move End (Fetch Address)
      map.on('moveend', () => {
         // If we moved the map programmatically (e.g. search result), 
         // preserve the formatted address from search instead of reverse geocoding
         if (isProgrammaticMove.current) {
             isProgrammaticMove.current = false;
             return;
         }
         
         const { lat, lng } = map.getCenter();
         fetchAddress(lat, lng);
      });

      // Event: Click to Pan
      map.on('click', (e: any) => { 
          map.flyTo(e.latlng); 
      });

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
                  
                  isProgrammaticMove.current = true;
                  map.setView([lat, lon], 16);
                  
                  setSelectedAddress(formatted || initialLocation); 
                  setSearchQuery(formatted || initialLocation);
                  locResolved = true;
              }
          } catch {}
      }

      if (!locResolved && navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            // Native geolocation doesn't give address, so let moveend fetch it (don't set programmatic flag)
            map.flyTo([latitude, longitude], 16); 
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
      if (data.features?.length > 0) {
          const formatted = data.features[0].properties.formatted;
          setSelectedAddress(formatted);
          setSearchQuery(formatted);
      } else {
          const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedAddress(coords);
          setSearchQuery(coords);
      }
    } catch { 
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSelectedAddress(coords); 
        setSearchQuery(coords);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); if (!searchQuery.trim()) return; setIsSearching(true);
    setShowSuggestions(false);
    try {
        const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`);
        const data = await res.json();
        if (data.features?.length > 0) {
            const { lat, lon, formatted } = data.features[0].properties;
            
            isProgrammaticMove.current = true;
            mapInstanceRef.current?.setView([lat, lon], 16);
            
            setSelectedAddress(formatted);
            setSearchQuery(formatted);
        } else alert("Location not found");
    } catch {} finally { setIsSearching(false); }
  };

  const handleSuggestionClick = (feature: any) => {
      const { lat, lon, formatted } = feature.properties;
      setSearchQuery(formatted);
      setSelectedAddress(formatted);
      setShowSuggestions(false);
      setSuggestions([]); // clear suggestions
      
      if (mapInstanceRef.current) {
          isProgrammaticMove.current = true;
          mapInstanceRef.current.setView([lat, lon], 16);
      }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return; setLoading(true);
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        // Don't set programmatic flag, so moveend triggers fetchAddress (reverse geocode)
        mapInstanceRef.current?.setView([latitude, longitude], 16); 
        setLoading(false);
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
               
               {/* Fixed Center Marker Overlay */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="w-4 h-4 bg-india-navy rounded-full border-[3px] border-white shadow-md"></div>
               </div>

               <div className="absolute top-4 left-4 z-[400] w-64 max-w-[calc(100%-80px)]">
                    <form onSubmit={handleSearch} className="relative shadow-md rounded-lg">
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder={t('search_address')} 
                            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-india-navy text-sm bg-white shadow-sm"
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        />
                        <button type="submit" disabled={isSearching} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-india-navy">{isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button>
                    
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 z-50">
                                {suggestions.map((item, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(item); }}
                                        className="w-full text-left px-4 py-3 text-xs border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors flex items-start gap-2"
                                    >
                                        <Navigation className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700">{item.properties.address_line1}</span>
                                            <span className="text-slate-500">{item.properties.address_line2}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
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