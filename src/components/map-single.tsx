"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

interface MapSingleProps {
  lat: number;
  lng: number;
  name: string;
}

export default function MapSingle({ lat, lng, name }: MapSingleProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (loadError) return <p className="text-red-600 text-sm">Error al cargar el mapa</p>;
  if (!isLoaded) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-500">Cargando mapa...</div>;

  return (
    <GoogleMap
      mapContainerClassName="w-full h-64 rounded-lg border border-gray-300"
      center={{ lat, lng }}
      zoom={16}
    >
      <Marker position={{ lat, lng }} title={name} />
    </GoogleMap>
  );
}
