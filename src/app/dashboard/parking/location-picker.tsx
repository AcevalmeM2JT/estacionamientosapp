"use client";

import { useState } from "react";
import MapPicker from "@/components/map-picker";

interface LocationPickerProps {
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultAddress?: string | null;
}

export default function LocationPicker({ defaultLat, defaultLng, defaultAddress }: LocationPickerProps) {
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);

  function handleLocationChange(latitude: number, longitude: number) {
    setLat(latitude);
    setLng(longitude);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ubicación en el mapa
        </label>
        <MapPicker
          defaultLat={defaultLat}
          defaultLng={defaultLng}
          onLocationChange={handleLocationChange}
        />
        {lat !== null && <input type="hidden" name="latitude" value={lat} />}
        {lng !== null && <input type="hidden" name="longitude" value={lng} />}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <input
          type="text"
          name="address"
          defaultValue={defaultAddress ?? ""}
          required
          placeholder="Ej: Calle Prat 1941"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}