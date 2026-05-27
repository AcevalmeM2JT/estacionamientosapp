"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { validateChileanPlate } from "@/lib/plate";

interface OperationsClientProps {
  parkingId: string;
  parkingName: string;
  availableSpots: number;
  totalSpots: number;
  isSubActive: boolean;
  activeVehicles: {
    id: string;
    license_plate: string;
    entry_time: string;
    is_subscriber: boolean;
  }[];
}

export default function OperationsClient({
  parkingId,
  parkingName,
  availableSpots,
  totalSpots,
  isSubActive,
  activeVehicles,
}: OperationsClientProps) {
  const router = useRouter();
  const entryRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"entry" | "exit">("entry");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"success" | "error" | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entryMsg, setEntryMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [entryPlate, setEntryPlate] = useState("");

  useEffect(() => {
    if (tab === "entry" && entryRef.current) {
      entryRef.current.focus();
    }
    if (tab === "exit" && searchRef.current) {
      searchRef.current.focus();
    }
    setEntryMsg(null);
    setSearchResult(null);
  }, [tab]);

  async function handleEntry(formData: FormData) {
    const plate = formData.get("licensePlate") as string;
    const validation = validateChileanPlate(plate);
    if (!validation.valid) {
      setEntryMsg({ text: validation.error!, type: "error" });
      return;
    }

    setSubmitting(true);
    setEntryMsg(null);
    try {
      const { registerEntry } = await import("@/lib/actions/vehicles");
      formData.set("licensePlate", validation.normalized);
      const result: any = await registerEntry(formData);
      if (result && "error" in result) {
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

  async function handleSearch(formData: FormData) {
    const plate = formData.get("searchPlate") as string;
    const validation = validateChileanPlate(plate);
    if (!validation.valid) {
      setSearchResult(validation.error!);
      setSearchType("error");
      return;
    }

    setSearching(true);
    setSearchResult(null);
    try {
      const { searchVehicle } = await import("@/lib/actions/vehicles");
      const result: any = await searchVehicle(parkingId, validation.normalized);
      if (result && "error" in result) {
        setSearchResult(result.error);
        setSearchType("error");
      } else if (result && "license_plate" in result) {
        setSearchResult(
          `Encontrado — ${result.license_plate}, desde ${new Date(result.entry_time).toLocaleString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
        setSearchType("success");
      } else {
        setSearchResult("Vehículo no encontrado");
        setSearchType("error");
      }
      router.refresh();
    } catch {
      setSearchResult("Error al buscar vehículo");
      setSearchType("error");
    }
    setSearching(false);
  }

  function handleExitClick(vehicleId: string, paymentMethod: string) {
    const proceed = window.confirm("¿Procesar salida de este vehículo?");
    if (!proceed) return;
    handleExit(vehicleId, paymentMethod);
  }

  async function handleExit(vehicleId: string, paymentMethod: string) {
    try {
      const { processExitFromForm } = await import("@/lib/actions/vehicles");
      const formData = new FormData();
      formData.append("vehicleId", vehicleId);
      formData.append("paymentMethod", paymentMethod);
      const result: any = await processExitFromForm(formData);
      if (result && "success" in result && result.success) {
        window.location.href = `/dashboard/receipt/${vehicleId}`;
      }
    } catch {
      alert("Error al procesar salida");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setTab("entry")}
          className={`py-4 text-base font-semibold rounded-xl transition-all ${
            tab === "entry"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          🚗 Entrada
        </button>
        <button
          type="button"
          onClick={() => setTab("exit")}
          className={`py-4 text-base font-semibold rounded-xl transition-all ${
            tab === "exit"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          🚙 Salida
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Estacionamiento</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{parkingName}</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Disponibles</p>
          <p className={`text-xl font-bold mt-1 ${availableSpots > 0 ? "text-green-600" : "text-red-600"}`}>
            {availableSpots} / {totalSpots}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Activos</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{activeVehicles.length}</p>
        </div>
      </div>

      {tab === "entry" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrar entrada</h2>

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
      )}

      {tab === "exit" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar vehículo</h2>

            <form action={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Patente a buscar
                </label>
                <input
                  ref={searchRef}
                  type="text"
                  name="searchPlate"
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

              <button
                type="submit"
                disabled={searching}
                className="w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {searching ? "Buscando..." : "Buscar vehículo"}
              </button>
            </form>

            {searchResult && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
                searchType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {searchResult}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Vehículos estacionados ({activeVehicles.length})
              </h2>
            </div>

            {activeVehicles.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No hay vehículos estacionados
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeVehicles.map((v) => (
                  <div key={v.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-gray-900 uppercase tracking-wider font-mono">
                        {v.license_plate}
                      </span>
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
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
        </>
      )}
    </div>
  );
}
