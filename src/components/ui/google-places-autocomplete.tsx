/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { name: string; url: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  className?: string;
  showMap?: boolean;
}

let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

const loadGoogleMaps = (): Promise<void> => {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API key not configured');
    return Promise.reject(new Error('No API key'));
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Αναζήτηση τοποθεσίας...',
  className = '',
  showMap = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(googleMapsLoaded);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setIsLoaded(true))
      .catch(() => console.warn('Google Maps not available, using plain input'));
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'gr' },
      fields: ['name', 'formatted_address', 'place_id', 'url', 'geometry'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place) {
        const name = place.name || place.formatted_address || '';
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        
        // Always use google.com/maps format - maps.google.com/?cid= gets blocked
        let url: string;
        if (lat && lng) {
          url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.place_id || ''}`;
        } else if (place.place_id) {
          url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
        } else {
          url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
        }
        
        onChange(name);
        onPlaceSelect?.({ name, url, lat, lng });
        
        if (lat && lng) {
          setSelectedCoords({ lat, lng });
        }
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded]);

  // Initialize & update map
  useEffect(() => {
    if (!showMap || !isLoaded || !mapRef.current || !selectedCoords) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: selectedCoords,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      });
    } else {
      mapInstanceRef.current.setCenter(selectedCoords);
    }

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    markerRef.current = new google.maps.Marker({
      position: selectedCoords,
      map: mapInstanceRef.current,
      title: value,
    });
  }, [showMap, isLoaded, selectedCoords]);

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-none ${className}`}
      />
      {showMap && selectedCoords && (
        <div
          ref={mapRef}
          className="w-full h-[180px] border border-border rounded-none"
        />
      )}
    </div>
  );
};
