import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner } from "@/lib/actions/parking";
import { getRecentTransactions } from "@/lib/actions/transactions";
import Link from "next/link";

function formatCLP(amount: number) {
  return `$${amount.toLocaleString("es-CL")}`;
}

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

  const transactions = await getRecentTransactions(parkings[0].id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-600 mt-1">Historial de transacciones y pagos</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">No hay pagos registrados</p>
          <p className="text-gray-400 text-sm">
            Los pagos aparecerán aquí cuando proceses salidas de vehículos
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Método
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/dashboard/receipt/${tx.vehicle_id}`}>
                        {tx.receipt_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.vehicle.license_plate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tx.paid_at.toLocaleDateString("es-CL")}{" "}
                      {tx.paid_at.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tx.duration_minutes >= 60
                        ? `${Math.floor(tx.duration_minutes / 60)}h ${tx.duration_minutes % 60}m`
                        : `${tx.duration_minutes} min`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {methodLabel(tx.payment_method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
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
