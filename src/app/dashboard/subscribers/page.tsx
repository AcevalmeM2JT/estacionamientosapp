import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner } from "@/lib/actions/parking";
import { getSubscribersByParking, registerSubscriber, deactivateSubscriber } from "@/lib/actions/subscribers";

export default async function SubscribersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "WORKER") redirect("/dashboard");

  const parkings = await getParkingsByOwner();
  
  if (parkings.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Abonados</h1>
          <p className="text-gray-600 mt-1">Administra vehículos frecuentes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes estacionamientos configurados</h3>
          <p className="mt-2 text-sm text-gray-500">
            Configura tu estacionamiento primero para gestionar abonados.
          </p>
        </div>
      </div>
    );
  }

  const parkingId = parkings[0].id;
  const subscribers = await getSubscribersByParking(parkingId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Abonados</h1>
        <p className="text-gray-600 mt-1">Administra vehículos frecuentes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Registrar nuevo abonado</h2>
          <form action={async (formData) => {
            "use server";
            await registerSubscriber(formData);
          }} className="space-y-4">
            <input type="hidden" name="parkingId" value={parkingId} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patente
              </label>
              <input
                type="text"
                name="licensePlate"
                required
                placeholder="Ej: ABCD12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del propietario
              </label>
              <input
                type="text"
                name="ownerName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (opcional)
              </label>
              <input
                type="text"
                name="ownerPhone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto mensual (CLP)
              </label>
              <input
                type="number"
                name="monthlyFeeClp"
                required
                min={1}
                placeholder="Ej: 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Registrar abonado
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Abonados registrados ({subscribers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensualidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No hay abonados registrados
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sub.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.owner_name}
                        {sub.owner_phone && (
                          <div className="text-xs text-gray-400">{sub.owner_phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${sub.monthly_fee_clp.toLocaleString("es-CL")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.start_date).toLocaleDateString("es-CL")} - {new Date(sub.end_date).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sub.is_active && (
                          <form action={async () => {
                            "use server";
                            await deactivateSubscriber(sub.id);
                          }} className="inline">
                            <button
                              type="submit"
                              className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                            >
                              Desactivar
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
