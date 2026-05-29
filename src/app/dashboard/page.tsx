import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getActiveSubscription, getRequiredTier, getTotalSpots } from "@/lib/actions/subscription";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/stats";
import { DashboardLiveIndicator } from "./live-indicator";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const subscription = await getActiveSubscription();
  const requiredTier = await getRequiredTier();
  const totalSpots = await getTotalSpots();
  const stats = await getDashboardStats(session.user.id);
  const recentVehicles = await getRecentActivity(session.user.id);

  const parkingCount = stats?.totalParkings ?? 0;
  const workerCount = await prisma.parkingWorker.count({
    where: { user_id: session.user.id },
  });
  const subscriberCount = await prisma.subscriber.count({
    where: { parking: { owner_id: session.user.id }, is_active: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {session.user.name}
        </h1>
        <p className="text-gray-700 mt-1">Panel de control de tu estacionamiento</p>
        <DashboardLiveIndicator />
      </div>

      {requiredTier && !requiredTier.isFree && !subscription && session.user.role !== "SUPER_ADMIN" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-yellow-800">
            Tienes {totalSpots} plaza{totalSpots !== 1 ? "s" : ""}. Necesitas el plan <strong>{requiredTier.label}</strong> (${requiredTier.pricePerMonth.toLocaleString("es-CL")}/mes) para operar.
          </p>
          <Link
            href="/dashboard/subscription"
            className="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Ver planes
          </Link>
        </div>
      )}

      {parkingCount > 0 && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Ingresos hoy</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${stats.incomeToday.toLocaleString("es-CL")}
                  </p>
                </div>
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
                <p className="text-xs text-gray-500 mt-2">
                {stats.entriesToday} vehículo{stats.entriesToday !== 1 ? "s" : ""} hoy
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Ocupación</p>
                  <p className={`text-2xl font-bold mt-1 ${stats.parkedCount > 0 ? "text-gray-900" : "text-green-600"}`}>
                    {stats.parkedCount} / {stats.totalSpots}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  stats.parkedCount >= stats.totalSpots ? "bg-red-100" : stats.parkedCount > stats.totalSpots * 0.8 ? "bg-yellow-100" : "bg-blue-100"
                }`}>
                  <svg className={`w-5 h-5 ${
                    stats.parkedCount >= stats.totalSpots ? "text-red-600" : stats.parkedCount > stats.totalSpots * 0.8 ? "text-yellow-600" : "text-blue-600"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.totalSpots - stats.parkedCount} disponible{stats.totalSpots - stats.parkedCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estacionamientos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{parkingCount}</p>
                </div>
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{workerCount} trabajador{workerCount !== 1 ? "es" : ""}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Abonados</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{subscriberCount}</p>
                </div>
                <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{subscriberCount > 0 ? "Activos" : "Sin abonados"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Acciones rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/operations"
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Nueva entrada</p>
                    <p className="text-xs text-gray-500">Registrar vehículo</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/payments"
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Pagos hoy</p>
                    <p className="text-xs text-gray-500">${stats.incomeToday.toLocaleString("es-CL")}</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/subscribers"
                  className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Abonados</p>
                    <p className="text-xs text-gray-500">{subscriberCount} activos</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/parking"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Configurar</p>
                    <p className="text-xs text-gray-500">Preferencias</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Últimos movimientos</h3>
                <Link href="/dashboard/payments" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Ver todos
                </Link>
              </div>

              {recentVehicles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Sin movimientos recientes</p>
              ) : (
                <div className="space-y-3">
                  {recentVehicles.slice(0, 5).map((v) => (
                    <div key={v.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${v.status === "PARKED" ? "bg-green-500" : "bg-gray-300"}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{v.license_plate}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(v.entry_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                            {v.status === "COMPLETED" && v.exit_time && (
                              <> — {new Date(v.exit_time).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        v.status === "PARKED" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {v.status === "PARKED" ? "Estacionado" : v.is_subscriber ? "Abonado" : "Completado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {parkingCount === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes estacionamientos</h3>
          <p className="mt-2 text-sm text-gray-500">
            Comienza configurando tu primer estacionamiento para aparecer en el marketplace.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/parking"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Crear mi estacionamiento
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
