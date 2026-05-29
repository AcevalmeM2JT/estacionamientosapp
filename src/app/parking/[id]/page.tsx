import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import MapSingle from "@/components/map-single";

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

function getOpenStatus(opensAt?: string | null, closesAt?: string | null) {
  if (!opensAt || !closesAt) return null;
  const now = getCurrentTimeInMinutes();
  const open = parseTimeToMinutes(opensAt);
  const close = parseTimeToMinutes(closesAt);
  if (close < open) {
    return { isOpen: now >= open || now < close, opensAt, closesAt };
  }
  return { isOpen: now >= open && now < close, opensAt, closesAt };
}

async function getParkingDetail(id: string) {
  try {
    const parking = await prisma.parkingFacility.findUnique({
      where: { id, is_public: true, is_active: true },
      include: { pricing_config: true },
    });
    return parking;
  } catch {
    return null;
  }
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

export default async function ParkingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const parking = await getParkingDetail(params.id);

  if (!parking) {
    notFound();
  }

  const parkedCount = await prisma.vehicle.count({
    where: { parking_id: params.id, status: "PARKED" },
  });
  const availableSpots = parking.total_spots - parkedCount;
  const status = getOpenStatus(parking.opens_at, parking.closes_at);
  const occupancy = parking.total_spots > 0
    ? Math.round((parkedCount / parking.total_spots) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">
                DondeEstaciono
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Registrar estacionamiento
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al marketplace
        </Link>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {parking.name}
                </h1>
                <p className="text-gray-600 mt-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {parking.address}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-4 py-2 text-sm font-bold rounded-full ${
                    availableSpots > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {availableSpots > 0
                    ? `${availableSpots} disponibles`
                    : "Completo"}
                </span>
                {status && (
                  <span
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full inline-flex items-center gap-1.5 ${
                      status.isOpen
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    {status.isOpen ? "Abierto ahora" : "Cerrado"}
                  </span>
                )}
              </div>
            </div>

            {parking.description && (
              <p className="mt-6 text-gray-700 leading-relaxed">{parking.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Información</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Total lugares</span>
                <span className="font-bold text-gray-900 text-lg">{parking.total_spots}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Ocupados</span>
                <span className="font-bold text-gray-900 text-lg">{parkedCount}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Disponibles</span>
                <span className={`font-bold text-lg ${availableSpots > 0 ? "text-green-600" : "text-red-600"}`}>
                  {availableSpots}
                </span>
              </div>
              <div className="py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Ocupación</span>
                  <span className="font-semibold text-gray-700">{occupancy}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      occupancy === 0 ? "bg-green-400"
                      : occupancy > 80 ? "bg-red-400"
                      : occupancy > 50 ? "bg-amber-400"
                      : "bg-green-400"
                    }`}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hours Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Horario</h2>
            </div>
            <div className="space-y-4">
              {status ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Estado</span>
                    <span className={`font-semibold inline-flex items-center gap-1.5 ${
                      status.isOpen ? "text-green-700" : "text-red-700"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${status.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      {status.isOpen ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Apertura</span>
                    <span className="font-bold text-gray-900">{status.opensAt}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600 font-medium">Cierre</span>
                    <span className="font-bold text-gray-900">{status.closesAt}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <span className="text-gray-400 text-sm">Horario no configurado</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Acciones</h2>
            </div>
            <div className="space-y-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Cómo llegar
              </a>
              {parking.latitude && parking.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${parking.latitude},${parking.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ver en Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        {parking.pricing_config && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Tarifas</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {parking.pricing_config.price_per_minute !== null &&
                  parking.pricing_config.price_per_minute !== undefined && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center hover:border-blue-200 transition-colors">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(parking.pricing_config.price_per_minute)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">Por minuto</div>
                    </div>
                  )}
                {parking.pricing_config.price_per_hour !== null &&
                  parking.pricing_config.price_per_hour !== undefined && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center hover:border-blue-200 transition-colors">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(parking.pricing_config.price_per_hour)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">Por hora</div>
                    </div>
                  )}
                {parking.pricing_config.price_per_day !== null &&
                  parking.pricing_config.price_per_day !== undefined && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center hover:border-blue-200 transition-colors">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(parking.pricing_config.price_per_day)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">Por día</div>
                    </div>
                  )}
                {parking.pricing_config.price_per_month !== null &&
                  parking.pricing_config.price_per_month !== undefined && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center hover:border-blue-200 transition-colors">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(parking.pricing_config.price_per_month)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">Por mes</div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Map Section */}
        {parking.latitude && parking.longitude && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Ubicación</h2>
              </div>
              <MapSingle
                lat={parking.latitude}
                lng={parking.longitude}
                name={parking.name}
              />
            </div>
          </div>
        )}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          DondeEstaciono © {new Date().getFullYear()} - Chile
        </div>
      </footer>
    </div>
  );
}
