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
  const [addressValue, setAddressValue] = useState(defaultAddress ?? "");

  function handleLocationChange(latitude: number, longitude: number, address: string) {
    setLat(latitude);
    setLng(longitude);
    setAddressValue(address);
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
          value={addressValue}
          onChange={(e) => setAddressValue(e.target.value)}
          required
          placeholder="Selecciona una ubicación en el mapa o escribe la dirección"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
