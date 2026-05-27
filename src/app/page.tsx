import Link from "next/link";
import { prisma } from "@/lib/db";
import MapParkings from "@/components/map-parkings";

export const dynamic = "force-dynamic";

async function getPublicParkings() {
  try {
    const parkings = await prisma.parkingFacility.findMany({
      where: { is_public: true, is_active: true },
      include: { pricing_config: true },
      orderBy: { created_at: "desc" },
    });

    const parkingsWithAvailability = await Promise.all(
      parkings.map(async (parking) => {
        const parkedCount = await prisma.vehicle.count({
          where: {
            parking_id: parking.id,
            status: "PARKED",
          },
        });

        const availableSpots = parking.total_spots - parkedCount;

        const pricing = parking.pricing_config;
        const prices: { label: string; price: number; key: string }[] = [];
        if (pricing) {
          const entries: [string, string, number | null][] = [
            ["price_per_minute", "min", pricing.price_per_minute],
            ["price_per_hour", "hora", pricing.price_per_hour],
            ["price_per_day", "día", pricing.price_per_day],
            ["price_per_month", "mes", pricing.price_per_month],
          ];
          for (const [key, label, value] of entries) {
            if (value !== null && value !== undefined && value > 0) {
              prices.push({ label, price: value, key });
            }
          }
        }

        const lowest = prices.length > 0 ? prices.reduce((a, b) => (a.price < b.price ? a : b)) : null;

        return {
          id: parking.id,
          name: parking.name,
          address: parking.address,
          lat: parking.latitude ?? 0,
          lng: parking.longitude ?? 0,
          total_spots: parking.total_spots,
          availableSpots,
          pricing,
          lowestPrice: lowest,
        };
      })
    );

    return parkingsWithAvailability;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const parkings = await getPublicParkings();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">
                EstacionamientosApp
              </span>
            </div>
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

      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">
            Encuentra estacionamiento en tiempo real
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Marketplace de estacionamientos en Chile. Ve disponibilidad y precios al instante.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100"
            >
              Soy administrador
            </Link>
            <a
              href="#parkings"
              className="px-6 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Ver estacionamientos
            </a>
          </div>
        </div>
      </div>

      <div id="parkings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Estacionamientos disponibles
        </h2>

        {parkings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              Aún no hay estacionamientos públicos registrados
            </p>
            <Link
              href="/register"
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Sé el primero en registrar el tuyo →
            </Link>
          </div>
        ) : (
          <MapParkings
            parkings={parkings.map((p) => ({
              id: p.id,
              name: p.name,
              address: p.address,
              lat: p.lat,
              lng: p.lng,
              total_spots: p.total_spots,
              availableSpots: p.availableSpots,
              pricing: p.pricing,
              lowestPrice: p.lowestPrice,
            }))}
          />
        )}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          EstacionamientosApp © {new Date().getFullYear()} - Chile
        </div>
      </footer>
    </div>
  );
}
