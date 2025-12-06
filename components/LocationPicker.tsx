import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Check, X, Loader2, AlertTriangle, Search, LocateFixed } from 'lucide-react';

// Use the Geoapify key provided
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
  // Track specific map load error separate from critical failure
  const [mapError, setMapError] = useState<boolean>(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Initialize Map
    if (mapContainerRef.current && !mapInstanceRef.current) {
      initMap();
    }
    
    return () => {
      // Cleanup map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = async () => {
    try {
      // Check if Leaflet is loaded
      if (!(window as any).L) {
        setError("Map Module (Leaflet) not loaded.");
        setLoading(false);
        return;
      }

      const L = (window as any).L;

      // Default center (Bangalore approx) - used if no other location found
      const defaultLat = 12.9716;
      const defaultLng = 77.5946;

      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([defaultLat, defaultLng], 14);
      mapInstanceRef.current = map;
      
      // Add zoom control to top right to avoid conflict with search bar
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      // Geoapify OSM Bright Tile Layer (Standard Theme)
      const tileLayer = L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`, {
        attribution: 'Powered by Geoapify | © OpenStreetMap contributors',
        maxZoom: 20, 
        id: 'osm-bright',
      });
      
      tileLayer.addTo(map);
      
      // Add tile error handler
      tileLayer.on('tileerror', () => {
         setMapError(true);
         // Do not block UI, just note it
      });

      // Standard Marker Icon (Blue Dot)
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      // Add Marker
      const marker = L.marker([defaultLat, defaultLng], { icon: customIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      // Map Click Event
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handleLocationSelect(lat, lng);
      });

      // Marker Drag Event
      marker.on('dragend', (e: any) => {
        const { lat, lng } = marker.getLatLng();
        handleLocationSelect(lat, lng);
      });

      // Logic to resolve initial view
      let locationResolved = false;

      if (initialLocation && initialLocation.trim() !== "" && initialLocation !== "Unknown Location") {
          try {
              const encoded = encodeURIComponent(initialLocation);
              const response = await fetch(
                  `https://api.geoapify.com/v1/geocode/search?text=${encoded}&apiKey=${GEOAPIFY_API_KEY}&limit=1`
              );
              const data = await response.json();
              if (data.features && data.features.length > 0) {
                  const { lat, lon, formatted } = data.features[0].properties;
                  map.setView([lat, lon], 16);
                  marker.setLatLng([lat, lon]);
                  // Set address directly so button is enabled immediately
                  setSelectedAddress(formatted || initialLocation);
                  locationResolved = true;
              }
          } catch (e) {
              console.warn("Initial location resolution failed", e);
          }
      }

      if (!locationResolved && navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 16);
                marker.setLatLng([lat, lng]);
                handleLocationSelect(lat, lng);
            },
            () => {
                // Denied or failed, just stop loading
                setLoading(false);
            }
         );
      } else {
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to initialize Geo-Interface.");
      setLoading(false);
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedAddress("Scanning Grid...");
    
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      );
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        const formatted = properties.formatted;
        setSelectedAddress(formatted);
      } else {
        setSelectedAddress("Unknown Sector");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      // Fallback to coordinates so button is enabled
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
           mapInstanceRef.current.setView([latitude, longitude], 16);
           markerRef.current.setLatLng([latitude, longitude]);
           handleLocationSelect(latitude, longitude);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoading(false);
        let msg = "Unable to retrieve location.";
        if (error.code === 1) msg = "Location permission denied. Please enable access.";
        else if (error.code === 2) msg = "Location unavailable.";
        else if (error.code === 3) msg = "Location request timed out.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
        const encoded = encodeURIComponent(searchQuery);
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encoded}&apiKey=${GEOAPIFY_API_KEY}&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const { lat, lon, formatted } = data.features[0].properties;
            if (mapInstanceRef.current && markerRef.current) {
                mapInstanceRef.current.setView([lat, lon], 16);
                markerRef.current.setLatLng([lat, lon]);
                setSelectedAddress(formatted);
            }
        } else {
            alert("Location not found");
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsSearching(false);
    }
  };

  // ROBUST ENABLE LOGIC: Ensure button is enabled if we have a string that isn't the loading state
  const isConfirmEnabled = Boolean(selectedAddress && selectedAddress !== "Scanning Grid..." && selectedAddress.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
           <div className="flex items-center gap-2 text-cyan-400">
              <MapPin className="w-5 h-5" />
              <h3 className="font-mono font-bold tracking-wider uppercase">SatNav Target Lock</h3>
           </div>
           <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
           </button>
        </div>

        {/* Map Container */}
        <div className="flex-grow relative bg-slate-100">
           {loading && !error && (
             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/80 text-cyan-700">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <span className="font-mono text-xs uppercase tracking-widest">Acquiring Satellite Feed...</span>
             </div>
           )}
           
           {error ? (
             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-red-500 p-8 text-center bg-slate-100">
                <AlertTriangle className="w-12 h-12 mb-4 animate-pulse" />
                <p className="font-mono font-bold mb-2 text-lg">SIGNAL LOST</p>
                <p className="text-sm font-mono text-red-500/70 mb-6 max-w-md">{error}</p>
                <button 
                  onClick={onCancel}
                  className="px-6 py-2 border border-red-500/50 hover:bg-red-50 text-red-500 font-mono text-xs uppercase rounded transition-colors"
                >
                  Return to Manual Entry
                </button>
             </div>
           ) : (
             <>
               <div ref={mapContainerRef} className="w-full h-full z-0" />
               
               {/* Search Overlay */}
               <div className="absolute top-4 left-4 z-[400] w-64 max-w-[calc(100%-80px)]">
                    <form onSubmit={handleSearch} className="relative shadow-lg rounded-full">
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search location..."
                            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-800 text-sm font-sans bg-white/95 backdrop-blur-sm"
                        />
                        <button 
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-transparent text-slate-500 hover:text-cyan-600 rounded-full transition-colors"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </form>
               </div>
             </>
           )}

           {/* Map Controls Overlay */}
           {!error && (
             <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[400]">
                <button 
                  onClick={handleCurrentLocation}
                  className="p-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 shadow-lg transition-all"
                  title="Center on My Location"
                >
                  <LocateFixed className="w-5 h-5" />
                </button>
             </div>
           )}
        </div>

        {/* Footer / Address Display */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-4">
           <div className="w-full">
              <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">Detected Coordinates</div>
              <div className="text-sm text-slate-200 font-mono truncate border border-slate-800 bg-slate-900 px-3 py-2 rounded">
                 {selectedAddress || (error ? "System Offline" : "Select a point on the map...")}
              </div>
           </div>
           
           <button 
             onClick={() => onConfirm(selectedAddress)}
             disabled={!isConfirmEnabled}
             className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
           >
              <Check className="w-4 h-4" />
              Confirm Grid
           </button>
        </div>

      </div>
    </div>
  );
};