import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner } from "@/lib/actions/parking";
import { getRecentActivity } from "@/lib/actions/activity";

const actionLabels: Record<string, string> = {
  VEHICLE_ENTRY: "Entrada de vehículo",
  VEHICLE_EXIT: "Salida de vehículo",
  WORKER_ASSIGNED: "Trabajador asignado",
  WORKER_REMOVED: "Trabajador removido",
  SUBSCRIBER_CREATED: "Abonado registrado",
  SUBSCRIBER_DEACTIVATED: "Abonado desactivado",
};

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parkings = await getParkingsByOwner();
  if (parkings.length === 0) {
    redirect("/dashboard/parking");
  }

  const activities = await getRecentActivity(parkings[0].id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Actividad</h1>
        <p className="text-gray-600 mt-1">Registro de acciones realizadas</p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">Sin actividad registrada</p>
          <p className="text-gray-400 text-sm">
            Las acciones aparecerán aquí a medida que uses la plataforma
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {activities.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {actionLabels[log.action] || log.action}
                    </p>
                    {log.details && (
                      <pre className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-500">
                      {log.created_at.toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {log.created_at.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {log.user && (
                      <p className="text-xs text-gray-400 mt-1">{log.user.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
