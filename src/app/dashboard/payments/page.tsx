import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner } from "@/lib/actions/parking";
import { getRecentTransactions, getTodayStats } from "@/lib/actions/transactions";
import Link from "next/link";
import { formatCLP, formatDateTime } from "@/lib/format";

function methodLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    CARD: "Tarjeta",
  };
  return labels[method] || method;
}

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "WORKER") redirect("/dashboard");

  const parkings = await getParkingsByOwner();
  if (parkings.length === 0) {
    redirect("/dashboard/parking");
  }

  const parkingId = parkings[0].id;
  const transactions = await getRecentTransactions(parkingId);
  const todayStats = await getTodayStats(parkingId);

  const totalAllTime = transactions.reduce((sum, t) => sum + t.amount_clp, 0);
  const totalTransactions = transactions.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-700 mt-1">Historial de transacciones y pagos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recaudado hoy</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {todayStats ? formatCLP(todayStats.totalIncome) : "$0"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {todayStats?.totalVehicles ?? 0} transacción{ (todayStats?.totalVehicles ?? 0) !== 1 ? "es" : "" } hoy
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recaudado total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCLP(totalAllTime)}</p>
          <p className="text-xs text-gray-500 mt-1">{totalTransactions} transacción{totalTransactions !== 1 ? "es" : ""}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Método más usado</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {(() => {
              const counts: Record<string, number> = {};
              transactions.forEach(t => {
                counts[t.payment_method] = (counts[t.payment_method] || 0) + 1;
              });
              const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
              return top ? methodLabel(top[0]) : "—";
            })()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(() => {
              const counts: Record<string, number> = {};
              transactions.forEach(t => {
                counts[t.payment_method] = (counts[t.payment_method] || 0) + 1;
              });
              const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              return entries.length > 0 ? `${entries[0][1]} transacciones` : "";
            })()}
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No hay pagos registrados</p>
          <p className="text-gray-500 text-sm">
            Los pagos aparecerán aquí cuando proceses salidas de vehículos
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Patente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Método
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {tx.receipt_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {tx.vehicle.license_plate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(tx.paid_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tx.duration_minutes >= 60
                        ? `${Math.floor(tx.duration_minutes / 60)}h ${tx.duration_minutes % 60}m`
                        : `${tx.duration_minutes} min`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {methodLabel(tx.payment_method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      {formatCLP(tx.amount_clp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}