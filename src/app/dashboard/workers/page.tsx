import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner } from "@/lib/actions/parking";
import { getWorkersByParking, removeWorker } from "@/lib/actions/workers";
import { AssignWorkerForm } from "./assign-worker-form";

export default async function WorkersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "WORKER") redirect("/dashboard");

  const parkings = await getParkingsByOwner();
  
  if (parkings.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-gray-600 mt-1">Gestiona los trabajadores asignados</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes estacionamientos configurados</h3>
          <p className="mt-2 text-sm text-gray-500">
            Configura tu estacionamiento primero para gestionar trabajadores.
          </p>
        </div>
      </div>
    );
  }

  const parkingId = parkings[0].id;
  const workers = await getWorkersByParking(parkingId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
        <p className="text-gray-600 mt-1">Gestiona los trabajadores asignados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Asignar trabajador</h2>
          <AssignWorkerForm parkingId={parkingId} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Trabajadores asignados ({workers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No hay trabajadores asignados
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {worker.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.user.phone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(worker.assigned_at).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <form action={async () => {
                          "use server";
                          await removeWorker(worker.id);
                        }} className="inline">
                          <button
                            type="submit"
                            className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                          >
                            Remover
                          </button>
                        </form>
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
