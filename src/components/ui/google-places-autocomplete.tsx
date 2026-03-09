import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { name: string; url: string }) => void;
  placeholder?: string;
  className?: string;
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
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(googleMapsLoaded);

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
        const url = place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
        onChange(name);
        onPlaceSelect?.({ name, url });
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

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-none ${className}`}
    />
  );
};
