"use client";

import { useRef, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript, Autocomplete } from "@react-google-maps/api";

const SANTIAGO_CENTER = { lat: -33.4489, lng: -70.6693 };

interface MapPickerProps {
  defaultLat?: number | null;
  defaultLng?: number | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

export default function MapPicker({ defaultLat, defaultLng, onLocationChange }: MapPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const [center, setCenter] = useState(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : SANTIAGO_CENTER
  );
  const [marker, setMarker] = useState(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null
  );
  const [address, setAddress] = useState("");
  const [dragPreview, setDragPreview] = useState<{ lat: number; lng: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getGeocoder() {
    if (!geocoderRef.current && window.google) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    return geocoderRef.current;
  }

  function reverseGeocode(lat: number, lng: number) {
    const geocoder = getGeocoder();
    if (!geocoder) return;

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    geocodeTimeoutRef.current = setTimeout(() => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const addr = results[0].formatted_address;
          setAddress(addr);
          onLocationChange(lat, lng, addr);
        } else {
          onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      });
    }, 200);
  }

  function placeMarker(lat: number, lng: number) {
    setMarker({ lat, lng });
    setCenter({ lat, lng });
    setDragPreview(null);
    reverseGeocode(lat, lng);
  }

  function onMarkerDragStart() {
    setDragPreview(marker);
  }

  function onMarkerDrag(e: google.maps.MapMouseEvent) {
    if (!e.latLng) return;
    setDragPreview({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }

  function onMarkerDragEnd(e: google.maps.MapMouseEvent) {
    if (!e.latLng) return;
    placeMarker(e.latLng.lat(), e.latLng.lng());
  }

  function onPlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setAddress(place.formatted_address || "");
    setMarker({ lat, lng });
    setCenter({ lat, lng });
    setDragPreview(null);
    onLocationChange(lat, lng, place.formatted_address || "");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => placeMarker(pos.coords.latitude, pos.coords.longitude),
      () => alert("No se pudo obtener tu ubicación")
    );
  }

  function onMapClick(e: google.maps.MapMouseEvent) {
    if (!e.latLng) return;
    placeMarker(e.latLng.lat(), e.latLng.lng());
  }

  const currentPos = dragPreview || marker;

  if (loadError) return <p className="text-red-600 text-sm">Error al cargar el mapa</p>;
  if (!isLoaded) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-500">Cargando mapa...</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Autocomplete
          onLoad={(ref) => { autocompleteRef.current = ref; }}
          onPlaceChanged={onPlaceChanged}
          className="flex-1"
        >
          <input
            type="text"
            placeholder="Buscar dirección..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Autocomplete>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap"
        >
          Mi ubicación
        </button>
      </div>

      <GoogleMap
        mapContainerClassName="w-full h-64 rounded-lg border border-gray-300"
        center={center}
        zoom={15}
        onClick={onMapClick}
      >
        {marker && (
          <Marker
            position={marker}
            draggable
            onDragStart={onMarkerDragStart}
            onDrag={onMarkerDrag}
            onDragEnd={onMarkerDragEnd}
          />
        )}

        {dragPreview && (
          <InfoWindow position={dragPreview}>
            <div className="text-xs whitespace-nowrap">
              <p className="font-medium">Arrastrando...</p>
              <p className="text-gray-500">
                {dragPreview.lat.toFixed(6)}, {dragPreview.lng.toFixed(6)}
              </p>
              <p className="text-blue-600 mt-0.5">Suelta para obtener dirección</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {currentPos && !dragPreview && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono">
            {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
          </span>
          {address && (
            <>
              <span className="text-gray-300">|</span>
              <span className="truncate flex-1">{address}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
