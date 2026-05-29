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
  opensAt?: string | null;
  closesAt?: string | null;
}

interface MapParkingsProps {
  parkings: ParkingPin[];
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

function getCurrentTimeInMinutes(): number {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

interface OpenStatus {
  isOpen: boolean;
  label: string;
  hoursLabel: string;
}

function getOpenStatus(opensAt?: string | null, closesAt?: string | null): OpenStatus | null {
  if (!opensAt || !closesAt) return null;
  const now = getCurrentTimeInMinutes();
  const open = parseTimeToMinutes(opensAt);
  const close = parseTimeToMinutes(closesAt);
  const hoursLabel = `${opensAt} - ${closesAt}`;

  if (close < open) {
    const isOpen = now >= open || now < close;
    return { isOpen, label: isOpen ? "Abierto ahora" : "Cerrado", hoursLabel };
  }

  const isOpen = now >= open && now < close;
  return { isOpen, label: isOpen ? "Abierto ahora" : "Cerrado", hoursLabel };
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
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Completo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" /> Abierto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Cerrado
          </span>
          {userLocation && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" /> Tú
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
            <div className="py-2 px-1 min-w-[270px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{selected.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{selected.address}</p>
                </div>
                <span
                  className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${
                    selected.availableSpots > 0
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {selected.availableSpots > 0
                    ? `${selected.availableSpots} libres`
                    : "Completo"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(() => {
                  const st = getOpenStatus(selected.opensAt, selected.closesAt);
                  if (!st) return null;
                  return (
                    <>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                        st.isOpen ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.isOpen ? "bg-green-500" : "bg-red-500"}`} />
                        {st.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {st.hoursLabel}
                      </span>
                    </>
                  );
                })()}
              </div>

              {selected.lowestPrice && (
                <div className="mt-2 text-xs text-gray-500">
                  Desde <span className="font-bold text-gray-900">{formatPrice(selected.lowestPrice.price)}</span> /{selected.lowestPrice.label}
                </div>
              )}

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayParkings.map((p) => {
          const distance = userLocation
            ? haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
            : null;
          const occupancy = p.total_spots
            ? Math.round(((p.total_spots - p.availableSpots) / p.total_spots) * 100)
            : 0;
          const status = getOpenStatus(p.opensAt, p.closesAt);
          const isClosed = status !== null && !status.isOpen;
          const isFull = p.availableSpots === 0;
          const isAvailable = !isClosed && !isFull;

          let topBarColor: string;
          let cardBorderHover: string;
          if (isClosed) {
            topBarColor = "bg-gray-400";
            cardBorderHover = "hover:border-gray-300";
          } else if (isFull) {
            topBarColor = "bg-red-400";
            cardBorderHover = "hover:border-red-200";
          } else {
            topBarColor = "bg-green-500";
            cardBorderHover = "hover:border-green-300";
          }

          return (
            <Link
              key={p.id}
              href={`/parking/${p.id}`}
              className={`group bg-white rounded-xl border border-gray-200 ${cardBorderHover} hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col ${isClosed ? "opacity-80" : ""}`}
            >
              <div className={`h-1.5 ${topBarColor}`} />

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </h3>
                      {!isClosed && !isFull && p.availableSpots <= 3 && (
                        <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase tracking-wide">
                          Últimos
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{p.address}</span>
                    </p>
                  </div>
                </div>

                {/* Status badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {status && (
                    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                      status.isOpen
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      {status.label}
                    </div>
                  )}
                  {status?.hoursLabel && (
                    <div className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {status.hoursLabel}
                    </div>
                  )}
                  {!status && (
                    <div className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sin horario
                    </div>
                  )}
                </div>

                {/* Availability bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    {isClosed ? (
                      <span className="font-semibold text-gray-500">Cerrado ahora</span>
                    ) : isFull ? (
                      <span className="font-semibold text-red-700">Completo</span>
                    ) : (
                      <span className="font-semibold text-green-700">{p.availableSpots} disponibles</span>
                    )}
                    <span className="text-gray-500">{p.total_spots ?? "—"} lugares</span>
                  </div>
                  {p.total_spots && (
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isClosed ? "bg-gray-300"
                          : isFull ? "bg-red-400"
                          : occupancy > 80 ? "bg-amber-400"
                          : "bg-green-400"
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Pricing */}
                {p.pricing && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-xs mb-3">
                    {p.pricing.price_per_minute ? (
                      <span className="whitespace-nowrap bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-100">
                        <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_minute)}</span>/min
                      </span>
                    ) : null}
                    {p.pricing.price_per_hour ? (
                      <span className="whitespace-nowrap bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-100">
                        <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_hour)}</span>/hora
                      </span>
                    ) : null}
                    {p.pricing.price_per_day ? (
                      <span className="whitespace-nowrap bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-100">
                        <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_day)}</span>/día
                      </span>
                    ) : null}
                    {p.pricing.price_per_month ? (
                      <span className="whitespace-nowrap bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-100">
                        <span className="font-semibold text-gray-900">{formatPrice(p.pricing.price_per_month)}</span>/mes
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {distance !== null ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="font-semibold text-gray-700">{formatDistance(distance)}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">{p.total_spots ?? "—"} lugares</span>
                    )}
                  </div>
                  {p.lowestPrice && !isClosed && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block leading-tight">Desde</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatPrice(p.lowestPrice.price)} <span className="text-xs font-normal">/{p.lowestPrice.label}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
