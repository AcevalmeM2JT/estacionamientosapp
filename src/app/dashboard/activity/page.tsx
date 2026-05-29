import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner } from "@/lib/actions/parking";
import { getRecentActivity } from "@/lib/actions/activity";

function formatCLP(amount: number) {
  return `$${amount.toLocaleString("es-CL")}`;
}

function methodLabel(method: string) {
  const labels: Record<string, string> = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta" };
  return labels[method] || method;
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">{label}:</span>
      <span className={`text-xs font-medium ${highlight ? "text-green-600 font-bold" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}

function ActivityDetails({ action, details }: { action: string; details: Record<string, unknown> | null }) {
  if (!details) return null;

  if (action === "VEHICLE_ENTRY") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        <DetailRow label="Patente" value={(details.license_plate as string) ?? ""} />
        <DetailRow label="Tipo" value={details.is_subscriber ? "Abonado" : "Ocasional"} highlight={!!details.is_subscriber} />
      </div>
    );
  }

  if (action === "VEHICLE_EXIT") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        <DetailRow label="Patente" value={(details.license_plate as string) ?? ""} />
        <DetailRow label="Método" value={methodLabel(details.payment_method as string)} />
        <DetailRow label="Cobro" value={details.is_subscriber ? "Sin cargo" : formatCLP(details.cost as number)} highlight />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
      {Object.entries(details ?? {}).map(([key, val]) => (
        <DetailRow key={key} label={key} value={String(val)} />
      ))}
    </div>
  );
}

const actionLabels: Record<string, string> = {
  VEHICLE_ENTRY: "Entrada de vehículo",
  VEHICLE_EXIT: "Salida de vehículo",
  WORKER_ASSIGNED: "Trabajador asignado",
  WORKER_REMOVED: "Trabajador removido",
  SUBSCRIBER_CREATED: "Abonado registrado",
  SUBSCRIBER_DEACTIVATED: "Abonado desactivado",
};

const actionIcons: Record<string, string> = {
  VEHICLE_ENTRY: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  VEHICLE_EXIT: "M20 12H4m0 0l6-6m-6 6l6 6",
  WORKER_ASSIGNED: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  WORKER_REMOVED: "M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  SUBSCRIBER_CREATED: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  SUBSCRIBER_DEACTIVATED: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

const actionColors: Record<string, string> = {
  VEHICLE_ENTRY: "bg-green-100 text-green-600",
  VEHICLE_EXIT: "bg-red-100 text-red-600",
  WORKER_ASSIGNED: "bg-blue-100 text-blue-600",
  WORKER_REMOVED: "bg-orange-100 text-orange-600",
  SUBSCRIBER_CREATED: "bg-purple-100 text-purple-600",
  SUBSCRIBER_DEACTIVATED: "bg-gray-100 text-gray-600",
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
        <p className="text-gray-700 mt-1">Registro de acciones realizadas</p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">Sin actividad registrada</p>
          <p className="text-gray-500 text-sm">
            Las acciones aparecerán aquí a medida que uses la plataforma
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {activities.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={actionIcons[log.action] || "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {actionLabels[log.action] || log.action}
                    </p>
                    <ActivityDetails action={log.action} details={log.details as Record<string, unknown> | null} />
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-gray-500">
                      {log.created_at.toLocaleDateString("es-CL", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {log.created_at.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
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