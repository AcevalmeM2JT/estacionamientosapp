import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import MapSingle from "@/components/map-single";

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

export default async function ParkingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const parking = await getParkingDetail(params.id);

  if (!parking) {
    notFound();
  }

  const availableSpots = parking.total_spots - parking.reserved_spots;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">
                EstacionamientosApp
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6 inline-block"
        >
          ← Volver al marketplace
        </Link>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {parking.name}
                </h1>
                <p className="text-gray-600 mt-2">{parking.address}</p>
              </div>
              <span
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  availableSpots > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {availableSpots > 0
                  ? `${availableSpots} disponibles`
                  : "Completo"}
              </span>
            </div>

            {parking.description && (
              <p className="mt-6 text-gray-700">{parking.description}</p>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Información
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de lugares</span>
                    <span className="font-medium">{parking.total_spots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lugares reservados</span>
                    <span className="font-medium">{parking.reserved_spots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disponibles</span>
                    <span className="font-medium text-green-600">
                      {availableSpots}
                    </span>
                  </div>
                </div>
              </div>

              {parking.pricing_config && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Tarifas
                  </h2>
                  <div className="space-y-3">
                    {parking.pricing_config.price_per_minute !== null &&
                      parking.pricing_config.price_per_minute !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Por minuto</span>
                          <span className="font-medium">
                            ${parking.pricing_config.price_per_minute}
                          </span>
                        </div>
                      )}
                    {parking.pricing_config.price_per_hour !== null &&
                      parking.pricing_config.price_per_hour !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Por hora</span>
                          <span className="font-medium">
                            ${parking.pricing_config.price_per_hour}
                          </span>
                        </div>
                      )}
                    {parking.pricing_config.price_per_day !== null &&
                      parking.pricing_config.price_per_day !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Por día</span>
                          <span className="font-medium">
                            ${parking.pricing_config.price_per_day}
                          </span>
                        </div>
                      )}
                    {parking.pricing_config.price_per_month !== null &&
                      parking.pricing_config.price_per_month !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Por mes</span>
                          <span className="font-medium">
                            ${parking.pricing_config.price_per_month}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {parking.latitude && parking.longitude && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h2>
                <MapSingle lat={parking.latitude} lng={parking.longitude} name={parking.name} />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          EstacionamientosApp © {new Date().getFullYear()} - Chile
        </div>
      </footer>
    </div>
  );
}
