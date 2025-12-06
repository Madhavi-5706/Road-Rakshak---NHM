import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Check, X, Loader2, AlertTriangle } from 'lucide-react';

interface LocationPickerProps {
  onConfirm: (address: string) => void;
  onCancel: () => void;
  initialLocation?: string;
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

export const LocationPicker: React.FC<LocationPickerProps> = ({ onConfirm, onCancel }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);
  const [geocoderInstance, setGeocoderInstance] = useState<any>(null);

  useEffect(() => {
    // Handle Global Auth Failure (Invalid Key)
    (window as any).gm_authFailure = () => {
      console.error("Google Maps Authentication Failure");
      setLoading(false);
      setError("ACCESS DENIED: Maps API Key Invalid or Not Enabled.");
    };

    // Check if Google Maps script is already loaded
    if ((window as any).google && (window as any).google.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      // Adding loading=async and callback=initMap is better practice, but sticking to previous simple logic with auth handler
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () => {
        setLoading(false);
        setError("CONNECTION FAILED: Unable to load SatNav Uplink.");
      };
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup global handler
      (window as any).gm_authFailure = undefined;
    };
  }, []);

  const initMap = () => {
    // Double check if loaded
    if (!(window as any).google?.maps) {
       // Retry shortly if script loaded but object not ready (unlikely with onload)
       return;
    }

    setLoading(true);
    if (!mapRef.current) return;

    try {
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      setGeocoderInstance(geocoder);

      // Default center (India/Bangalore approx)
      const defaultPos = { lat: 12.9716, lng: 77.5946 };

      const map = new google.maps.Map(mapRef.current, {
        center: defaultPos,
        zoom: 15,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
      });
      setMapInstance(map);

      const marker = new google.maps.Marker({
        map: map,
        position: defaultPos,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });
      setMarkerInstance(marker);

      // Listener for clicks
      map.addListener("click", (e: any) => {
        const clickedPos = e.latLng;
        marker.setPosition(clickedPos);
        geocodePosition(clickedPos, geocoder);
      });

      // Listener for drag
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        geocodePosition(pos, geocoder);
      });

      // Try to get actual location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(pos);
            marker.setPosition(pos);
            geocodePosition(pos, geocoder);
            setLoading(false);
          },
          () => {
            setLoading(false); // Failed to get location, keep default
          }
        );
      } else {
        setLoading(false);
      }

    } catch (e) {
      console.error(e);
      setError("Map Initialization Protocol Failed.");
      setLoading(false);
    }
  };

  const geocodePosition = (pos: any, geocoder: any) => {
    geocoder.geocode({ location: pos }, (results: any, status: any) => {
      if (status === "OK" && results[0]) {
        setSelectedAddress(results[0].formatted_address);
      } else {
        setSelectedAddress("Unknown Coordinates");
      }
    });
  };

  const handleCurrentLocation = () => {
    if (!mapInstance || !markerInstance || !geocoderInstance) return;
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstance.setCenter(pos);
          markerInstance.setPosition(pos);
          geocodePosition(pos, geocoderInstance);
          setLoading(false);
        },
        () => setLoading(false)
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
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
        <div className="flex-grow relative bg-black">
           {loading && !error && (
             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-cyan-400">
                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                <span className="font-mono text-xs uppercase tracking-widest">Acquiring Satellite Feed...</span>
             </div>
           )}
           
           {error ? (
             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-red-400 p-8 text-center bg-slate-950">
                <AlertTriangle className="w-12 h-12 mb-4 animate-pulse" />
                <p className="font-mono font-bold mb-2 text-lg">SIGNAL LOST</p>
                <p className="text-sm font-mono text-red-300/70 mb-6 max-w-md">{error}</p>
                <button 
                  onClick={onCancel}
                  className="px-6 py-2 border border-red-500/50 hover:bg-red-950/30 text-red-400 font-mono text-xs uppercase rounded transition-colors"
                >
                  Return to Manual Entry
                </button>
             </div>
           ) : (
             <div ref={mapRef} className="w-full h-full" />
           )}

           {/* Map Controls Overlay - Only show if no error */}
           {!error && (
             <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button 
                  onClick={handleCurrentLocation}
                  className="p-3 bg-slate-900 border border-slate-600 rounded-full text-cyan-400 hover:bg-slate-800 hover:text-white shadow-lg transition-all"
                  title="My Location"
                >
                  <Navigation className="w-5 h-5" />
                </button>
             </div>
           )}
        </div>

        {/* Footer / Address Display */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="flex-grow w-full sm:w-auto">
              <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">Detected Coordinates</div>
              <div className="text-sm text-slate-200 font-mono truncate border border-slate-800 bg-slate-900 px-3 py-2 rounded">
                 {selectedAddress || (error ? "System Offline" : "Select a point on the map...")}
              </div>
           </div>
           
           <button 
             onClick={() => onConfirm(selectedAddress)}
             disabled={!selectedAddress || !!error}
             className="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
           >
              <Check className="w-4 h-4" />
              Confirm Grid
           </button>
        </div>

      </div>
    </div>
  );
};
