"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateChileanPlate } from "@/lib/plate";
import { registerEntry, registerMultipleEntries, processExitFromForm } from "@/lib/actions/vehicles";

interface OperationsClientProps {
  parkingId: string;
  parkingName: string;
  availableSpots: number;
  totalSpots: number;
  reservedSpots: number;
  opensAt?: string;
  closesAt?: string;
  isSubActive: boolean;
  activeVehicles: {
    id: string;
    license_plate: string;
    entry_time: string;
    is_subscriber: boolean;
    is_reservation: boolean;
  }[];
}

interface ReceiptInfo {
  receiptNumber: string;
  licensePlate: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  amountClp: number;
  paymentMethod: string;
  isSubscriber: boolean;
}

interface BatchResult {
  plate: string;
  success: boolean;
  error?: string;
}

function formatCLP(amount: number) {
  return `$${amount.toLocaleString("es-CL")}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function methodLabel(method: string) {
  const labels: Record<string, string> = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta" };
  return labels[method] || method;
}

export default function OperationsClient({
  parkingId,
  parkingName,
  availableSpots,
  totalSpots,
  reservedSpots,
  opensAt,
  closesAt,
  isSubActive,
  activeVehicles,
}: OperationsClientProps) {
  const router = useRouter();
  const entryRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [entryMsg, setEntryMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [entryPlate, setEntryPlate] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [receipt, setReceipt] = useState<ReceiptInfo | null>(null);
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [batchPlates, setBatchPlates] = useState("");
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const filteredVehicles = activeVehicles.filter((v) =>
    v.license_plate.includes(searchFilter.toUpperCase())
  );

  async function handleEntry(formData: FormData) {
    const plate = formData.get("licensePlate") as string;
    const validation = validateChileanPlate(plate);
    if (!validation.valid) {
      setEntryMsg({ text: validation.error!, type: "error" });
      return;
    }

    setSubmitting(true);
    setEntryMsg(null);
    formData.set("licensePlate", validation.normalized);

    try {
      const result = await registerEntry(formData);
      if (result && "error" in result && result.error) {
        setEntryMsg({ text: result.error, type: "error" });
      } else {
        setEntryMsg({ text: "Entrada registrada", type: "success" });
        setEntryPlate("");
      }
      router.refresh();
    } catch {
      setEntryMsg({ text: "Error al registrar entrada", type: "error" });
    }
    setSubmitting(false);
    entryRef.current?.focus();
  }

  async function handleBatchEntry(formData: FormData) {
    setBatchSubmitting(true);
    setBatchResults(null);

    try {
      const result = await registerMultipleEntries(formData);
      if (result && "results" in result && result.results) {
        setBatchResults(result.results);
        setBatchPlates("");
      } else if (result && "error" in result) {
        setBatchResults([{ plate: "", success: false, error: result.error as string }]);
      }
      router.refresh();
    } catch {
      setBatchResults([{ plate: "", success: false, error: "Error al procesar" }]);
    }
    setBatchSubmitting(false);
    batchRef.current?.focus();
  }

  async function handleExitClick(vehicleId: string, paymentMethod: string) {
    try {
      const formData = new FormData();
      formData.append("vehicleId", vehicleId);
      formData.append("paymentMethod", paymentMethod);
      const result = await processExitFromForm(formData);

      if (result && "success" in result && result.success) {
        const now = new Date();
        setReceipt({
          receiptNumber: `REC-${Date.now()}`,
          licensePlate: activeVehicles.find(v => v.id === vehicleId)?.license_plate ?? "",
          entryTime: activeVehicles.find(v => v.id === vehicleId)?.entry_time ?? now.toISOString(),
          exitTime: now.toISOString(),
          durationMinutes: (result as { durationMinutes?: number }).durationMinutes ?? 0,
          amountClp: result.cost ?? 0,
          paymentMethod,
          isSubscriber: false,
        });
        router.refresh();
      } else if (result && "error" in result && result.error) {
        alert(result.error);
      }
    } catch {
      alert("Error al procesar salida");
    }
  }

  return (
    <div>
      {!isSubActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800 font-medium text-center">
            Tu suscripción no está activa. Las operaciones están bloqueadas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estacionamiento</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{parkingName}</p>
          {opensAt && closesAt && (
            <p className="text-xs text-gray-500 mt-1">{opensAt} — {closesAt}</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Disponibles</p>
          <p className={`text-xl font-bold mt-1 ${availableSpots > 0 ? "text-green-600" : "text-red-600"}`}>
            {availableSpots} / {totalSpots}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Estacionados</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{activeVehicles.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMode("single"); setBatchResults(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                mode === "single"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => { setMode("batch"); setEntryMsg(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                mode === "batch"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              Múltiple
            </button>
          </div>

          {mode === "single" ? (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <span className="mr-2">🚗</span>Registrar entrada
              </h2>

              {availableSpots <= 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl text-center font-medium">
                  No hay lugares disponibles
                </div>
              ) : (
                <form action={handleEntry} className="space-y-4">
                  <input type="hidden" name="parkingId" value={parkingId} />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Patente del vehículo
                    </label>
                    <input
                      ref={entryRef}
                      type="text"
                      name="licensePlate"
                      value={entryPlate}
                      onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                      required
                      autoComplete="off"
                      placeholder="Ej: ABCD12"
                      style={{ fontSize: "16px" }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isReservation"
                      id="isReservation"
                      value="true"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isReservation" className="text-sm text-gray-700">
                      Reserva por 1 día
                    </label>
                  </div>

                  {entryMsg && (
                    <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                      entryMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {entryMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isSubActive || submitting}
                    className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                  >
                    {submitting ? "Registrando..." : "Registrar entrada"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                <span className="mr-2">🚗</span>Entrada múltiple
              </h2>
              <p className="text-xs text-gray-500 mb-4">Una patente por línea o separada por comas</p>

              {availableSpots <= 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl text-center font-medium">
                  No hay lugares disponibles
                </div>
              ) : (
                <form action={handleBatchEntry} className="space-y-4">
                  <input type="hidden" name="parkingId" value={parkingId} />
                  <input type="hidden" name="isReservation" value="false" />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Patentes
                    </label>
                    <textarea
                      ref={batchRef}
                      name="plates"
                      value={batchPlates}
                      onChange={(e) => setBatchPlates(e.target.value.toUpperCase())}
                      required
                      rows={5}
                      placeholder={`ABCD12${String.fromCharCode(10)}BBCC34${String.fromCharCode(10)}SWLX59`}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {batchResults && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {batchResults.map((r, i) => (
                        <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                          r.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className="font-mono font-bold">{r.plate || "Error"}</span>
                          <span>{r.success ? "✓" : r.error}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isSubActive || batchSubmitting}
                    className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                  >
                    {batchSubmitting ? "Registrando..." : `Registrar todas (${batchPlates.split(/[\n,]+/).filter(p => p.trim()).length || 0})`}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 shrink-0">
              <span className="mr-2">🚙</span>Salida
            </h2>
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value.toUpperCase())}
                placeholder="Buscar patente..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-gray-500 shrink-0">{filteredVehicles.length} de {activeVehicles.length}</span>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              {searchFilter ? "No se encontraron vehículos con esa patente" : "No hay vehículos estacionados"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-gray-900 uppercase tracking-wider font-mono">
                      {v.license_plate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {v.is_reservation && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Reserva
                        </span>
                      )}
                      {v.is_subscriber ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Abonado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Ocasional
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(v.entry_time).toLocaleString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!v.is_subscriber && (
                      <div className="flex items-center gap-2">
                        <select
                          id={`payment-${v.id}`}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          defaultValue="CASH"
                        >
                          <option value="CASH">Efectivo</option>
                          <option value="TRANSFER">Transferencia</option>
                          <option value="CARD">Tarjeta</option>
                        </select>
                        <button
                          type="button"
                          disabled={!isSubActive}
                          onClick={() => {
                            const el = document.getElementById(`payment-${v.id}`) as HTMLSelectElement;
                            handleExitClick(v.id, el?.value || "CASH");
                          }}
                          className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Cobrar y salida
                        </button>
                      </div>
                    )}
                    {v.is_subscriber && (
                      <button
                        type="button"
                        onClick={() => handleExitClick(v.id, "CASH")}
                        className="px-5 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Liberar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setReceipt(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReceipt(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-900">DondeEstaciono</h2>
              <p className="text-xs text-gray-500">Comprobante de pago</p>
              {receipt.receiptNumber && (
                <p className="text-xs text-gray-400 mt-1">N° {receipt.receiptNumber}</p>
              )}
            </div>

              <div className="space-y-2 text-sm mb-6">
              <p className="font-semibold text-gray-900">{parkingName}</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Patente</span>
                <span className="font-semibold text-gray-900 uppercase">{receipt.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ingreso</span>
                <span className="text-gray-900">{new Date(receipt.entryTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Salida</span>
                <span className="text-gray-900">{new Date(receipt.exitTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duración</span>
                <span className="text-gray-900">{formatDuration(receipt.durationMinutes)}</span>
              </div>
              {receipt.isSubscriber ? (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cargo</span>
                    <span className="font-semibold text-green-600">Sin cargo (Abonado)</span>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">{formatCLP(receipt.amountClp)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Método</span>
                    <span className="text-gray-700">{methodLabel(receipt.paymentMethod)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Volver a operaciones
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}