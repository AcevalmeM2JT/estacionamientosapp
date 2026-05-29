import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getActiveSubscription, getSubscriptionHistory, activateSubscription,
  getRequiredTier, getAllTiers, getTrialStatus, getParkingSummary
} from "@/lib/actions/subscription";

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "WORKER") redirect("/dashboard");

  const activeSub = await getActiveSubscription();
  const history = await getSubscriptionHistory();
  const tier = await getRequiredTier();
  const allTiers = await getAllTiers();
  const trial = await getTrialStatus();
  const summary = await getParkingSummary();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Planes y Suscripción</h1>
        <p className="text-gray-600 mt-1">
          {summary.parkingCount === 0
            ? "Configura tu estacionamiento para calcular el plan ideal"
            : `${summary.parkingCount} estacionamiento${summary.parkingCount !== 1 ? "s" : ""}, ${summary.totalSpots} plaza${summary.totalSpots !== 1 ? "s" : ""} en total`
          }
        </p>
      </div>

      {trial.isInTrial && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-green-900">
                Periodo de prueba gratuito — {trial.daysLeft} día{trial.daysLeft !== 1 ? "s" : ""} restantes
              </h2>
              <p className="text-sm text-green-800">
                Disfruta de todas las funciones sin costo hasta el {trial.endsAt?.toLocaleDateString("es-CL", { dateStyle: "long" })}. Después del período de prueba, selecciona un plan para continuar operando.
              </p>
            </div>
          </div>
        </div>
      )}

      {!trial.isInTrial && activeSub && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Suscripción activa</h2>
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Activa</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium capitalize">{tier?.label ?? activeSub.plan_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estacionamientos</span>
              <span className="font-medium">{summary.parkingCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plazas</span>
              <span className="font-medium">{summary.totalSpots}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Inicio</span>
              <span className="font-medium">{activeSub.start_date.toLocaleDateString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vencimiento</span>
              <span className="font-medium">{activeSub.end_date.toLocaleDateString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto</span>
              <span className="font-medium">${activeSub.amount_clp.toLocaleString("es-CL")}</span>
            </div>
          </div>
        </div>
      )}

      {summary.parkingCount > 0 && summary.spotsPerParking.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculadora de costo</h2>
          <div className="space-y-3">
            {summary.spotsPerParking.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3">
                <span className="text-gray-700 font-medium">{p.name}</span>
                <span className="text-gray-600">{p.spots} plaza{p.spots !== 1 ? "s" : ""}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-bold pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{summary.totalSpots} plazas</span>
            </div>
          </div>

          {!trial.isInTrial && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-bold">Plan requerido: {tier?.label}</span>
                {tier && !tier.isFree && (
                  <span> — <span className="font-bold">${tier.pricePerMonth.toLocaleString("es-CL")}/mes</span></span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {!tier?.isFree && !activeSub && !trial.isInTrial && summary.totalSpots > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200 max-w-md mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{tier?.label}</h3>
          <p className="text-sm text-gray-500 mb-2">Para {summary.totalSpots} plaza{summary.totalSpots !== 1 ? "s" : ""}</p>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            ${tier?.pricePerMonth.toLocaleString("es-CL")}<span className="text-sm font-normal text-gray-500">/mes</span>
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>✓ {tier?.maxSpots ? `Hasta ${tier.maxSpots} plazas` : "Plazas ilimitadas"}</li>
            <li>✓ Entrada/salida de vehículos</li>
            <li>✓ Gestión de trabajadores</li>
            <li>✓ Abonados</li>
            <li>✓ Comprobantes imprimibles</li>
            <li>✓ Historial de pagos</li>
          </ul>

          <form action={async (formData) => {
            "use server";
            await activateSubscription(formData);
          }} className="space-y-3">
            <input type="hidden" name="planType" value={`tier${tier?.tier}`} />
            {tier && (
              <select name="months" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="1">1 mes — ${tier.pricePerMonth.toLocaleString("es-CL")}</option>
                <option value="3">3 meses — ${(tier.pricePerMonth * 3).toLocaleString("es-CL")}</option>
                <option value="6">6 meses — ${(tier.pricePerMonth * 6).toLocaleString("es-CL")}</option>
                <option value="12">12 meses — ${(tier.pricePerMonth * 12).toLocaleString("es-CL")}</option>
              </select>
            )}
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">
              Activar por ${tier?.pricePerMonth.toLocaleString("es-CL")}/mes
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Planes disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {allTiers.map((plan) => {
            const isSelected = tier?.tier === plan.tier;
            const isTrialActive = trial.isInTrial;
            return (
              <div key={plan.tier} className={`bg-white rounded-lg shadow-md p-4 border-2 ${isSelected && !isTrialActive ? "border-blue-500" : "border-gray-100"}`}>
                <h4 className="font-semibold text-gray-900 text-sm">{plan.label}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan.isFree ? "1 plaza gratis" : plan.maxSpots ? `${plan.tier === 1 ? "2" : "11"} a ${plan.maxSpots} plazas` : "51+ plazas"}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-2">
                  {plan.isFree ? "Gratis" : `$${plan.pricePerMonth.toLocaleString("es-CL")}/mes`}
                </p>
                {isSelected && !isTrialActive && !plan.isFree && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Requerido</span>
                )}
                {isSelected && isTrialActive && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">En prueba</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial</h2>
          <div className="space-y-3">
            {history.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3">
                <div>
                  <span className="capitalize font-medium">{sub.plan_type}</span>
                  <span className="text-gray-500 ml-2">
                    {sub.start_date.toLocaleDateString("es-CL")} - {sub.end_date.toLocaleDateString("es-CL")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">${sub.amount_clp.toLocaleString("es-CL")}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    sub.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {sub.status === "active" ? "Activa" : sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}