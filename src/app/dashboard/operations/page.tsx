import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner, getAvailableSpots } from "@/lib/actions/parking";
import { getActiveVehicles } from "@/lib/actions/vehicles";
import { checkSubscriptionActive } from "@/lib/actions/subscription";
import OperationsClient from "./operations-client";
import { AutoRefresh } from "./auto-refresh";

export default async function OperationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSubActive = await checkSubscriptionActive();
  const parkings = await getParkingsByOwner();

  if (parkings.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Operaciones</h1>
          <p className="text-gray-600 mt-1">Registra entradas y salidas de vehículos</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes estacionamientos configurados</h3>
          <p className="mt-2 text-sm text-gray-500">
            Configura tu estacionamiento primero para comenzar a operar.
          </p>
        </div>
      </div>
    );
  }

  const parking = parkings[0];
  const parkingId = parking.id;
  const availableSpots = await getAvailableSpots(parkingId);
  const activeVehiclesRaw = await getActiveVehicles(parkingId);

  const activeVehicles = activeVehiclesRaw.map((v) => ({
    id: v.id,
    license_plate: v.license_plate,
    entry_time: v.entry_time.toISOString(),
    is_subscriber: v.is_subscriber,
    is_reservation: v.is_reservation,
  }));

  return (
    <div>
      {!isSubActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800 font-medium text-center">
            Tu suscripción no está activa. Las operaciones están bloqueadas.
          </p>
        </div>
      )}

      <AutoRefresh />
      <OperationsClient
        parkingId={parkingId}
        parkingName={parking.name}
        availableSpots={availableSpots}
        totalSpots={parking.total_spots}
        reservedSpots={parking.reserved_spots}
        opensAt={parking.opens_at ?? undefined}
        closesAt={parking.closes_at ?? undefined}
        isSubActive={isSubActive}
        activeVehicles={activeVehicles}
      />
    </div>
  );
}