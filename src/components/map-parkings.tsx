"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import Link from "next/link";
import { haversineDistance } from "@/lib/geo";

const SANTIAGO_CENTER = { lat: -33.4489, lng: -70.6693 };
const POLL_INTERVAL = 15000;

interface PriceInfo {
  label: string;
  price: number;
  key: string;
}

export interface ParkingPin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  availableSpots: number;
  total_spots?: number;
  pricing?: {
    price_per_minute: number | null;
    price_per_hour: number | null;
    price_per_day: number | null;
    price_per_month: number | null;
    billing_mode: string;
  } | null;
  lowestPrice: PriceInfo | null;
}

interface MapParkingsProps {
  parkings: ParkingPin[];
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

function priceDetail(p: ParkingPin): string {
  if (!p.pricing) return "";
  const parts: string[] = [];
  if (p.pricing.price_per_minute) parts.push(`${formatPrice(p.pricing.price_per_minute)} /min`);
  if (p.pricing.price_per_hour) parts.push(`${formatPrice(p.pricing.price_per_hour)} /hora`);
  if (p.pricing.price_per_day) parts.push(`${formatPrice(p.pricing.price_per_day)} /día`);
  if (p.pricing.price_per_month) parts.push(`${formatPrice(p.pricing.price_per_month)} /mes`);
  return parts.join(" · ");
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function MapParkings({ parkings: initial }: MapParkingsProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    googleMapsClientId: undefined,
  });

  const [parkings, setParkings] = useState<ParkingPin[]>(initial);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<ParkingPin | null>(null);
  const [sortMode, setSortMode] = useState<"name" | "distance">("name");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/parkings/public");
        if (res.ok) {
          const data: ParkingPin[] = await res.json();
          setParkings(data);
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const displayParkings = useMemo(() => {
    if (sortMode === "distance" && userLocation) {
      return [...parkings].sort((a, b) => {
        const dA = haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const dB = haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return dA - dB;
      });
    }
    return parkings;
  }, [parkings, sortMode, userLocation]);

  const parkingsWithCoords = parkings.filter((p) => p.lat && p.lng);

  function getDirectionsUrl(lat: number, lng: number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  if (loadError) return <p className="text-red-600 text-sm">Error al cargar el mapa</p>;
  if (!isLoaded) return <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-500">Cargando mapa...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSortMode("name")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sortMode === "name"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setSortMode("distance")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sortMode === "distance"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Más cercanos
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Completo
          </span>
          {userLocation && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border-2 border-white" /> Tú
            </span>
          )}
        </div>
      </div>

      <GoogleMap
        mapContainerClassName="w-full h-[500px] rounded-xl border border-gray-200 shadow-sm"
        center={parkingsWithCoords.length > 0 ? parkingsWithCoords[0] : SANTIAGO_CENTER}
        zoom={12}
      >
        {parkingsWithCoords.map((p) => (
          <Marker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: p.availableSpots > 0 ? "#16a34a" : "#dc2626",
              fillOpacity: 0.9,
              strokeColor: "#fff",
              strokeWeight: 2,
              scale: 13,
            }}
            label={{
              text: String(p.availableSpots),
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
            }}
            onClick={() => setSelected(p)}
          />
        ))}

        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
              scale: 8,
            }}
            title="Tu ubicación"
          />
        )}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="py-2 px-1 min-w-[260px]">
              <h3 className="font-semibold text-gray-900 text-sm">{selected.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{selected.address}</p>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${
                    selected.availableSpots > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {selected.availableSpots > 0
                    ? `${selected.availableSpots} disponibles`
                    : "Completo"}
                </span>
                {selected.lowestPrice && (
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(selected.lowestPrice.price)} /{selected.lowestPrice.label}
                  </span>
                )}
              </div>

              {userLocation && selected.lat && selected.lng && (
                <p className="text-xs text-gray-400 mt-1.5">
                  <span className="inline-block mr-1">📍</span>
                  A {formatDistance(haversineDistance(userLocation.lat, userLocation.lng, selected.lat, selected.lng))} de ti
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <a
                  href={getDirectionsUrl(selected.lat, selected.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Cómo llegar
                </a>
                <Link
                  href={`/parking/${selected.id}`}
                  className="flex-1 text-center text-xs bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayParkings.map((p) => {
          const distance = userLocation
            ? haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
            : null;

          return (
            <Link
              key={p.id}
              href={`/parking/${p.id}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{p.address}</p>
                </div>
                <span
                  className={`ml-3 flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${
                    p.availableSpots > 0
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {p.availableSpots > 0
                    ? `${p.availableSpots} libres`
                    : "Lleno"}
                </span>
              </div>

              {p.pricing && (
                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                  {p.pricing.price_per_minute ? (
                    <span className="whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_minute)}</span>/min
                    </span>
                  ) : null}
                  {p.pricing.price_per_hour ? (
                    <span className="whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_hour)}</span>/hora
                    </span>
                  ) : null}
                  {p.pricing.price_per_day ? (
                    <span className="whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_day)}</span>/día
                    </span>
                  ) : null}
                  {p.pricing.price_per_month ? (
                    <span className="whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_month)}</span>/mes
                    </span>
                  ) : null}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {distance !== null ? (
                    <span>{formatDistance(distance)}</span>
                  ) : (
                    <span>{p.total_spots ?? "—"} lugares</span>
                  )}
                </div>
                {p.lowestPrice && (
                  <span className="text-xs font-semibold text-blue-600">
                    Desde {formatPrice(p.lowestPrice.price)} /{p.lowestPrice.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
