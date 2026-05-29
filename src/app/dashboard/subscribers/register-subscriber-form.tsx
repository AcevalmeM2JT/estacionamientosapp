"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerSubscriber } from "@/lib/actions/subscribers";
import { validateChileanPlate } from "@/lib/plate";

interface Props {
  parkingId: string;
}

export function RegisterSubscriberForm({ parkingId }: Props) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(formData: FormData): boolean {
    const errors: Record<string, string> = {};
    const plate = formData.get("licensePlate") as string;
    const ownerName = formData.get("ownerName") as string;
    const monthlyFee = formData.get("monthlyFeeClp") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    const plateValidation = validateChileanPlate(plate);
    if (!plateValidation.valid) errors.licensePlate = plateValidation.error || "Patente inválida";
    if (!ownerName || ownerName.trim().length < 2) errors.ownerName = "El nombre debe tener al menos 2 caracteres";
    if (!monthlyFee || parseInt(monthlyFee) < 1) errors.monthlyFeeClp = "Ingresá un monto válido";
    if (!startDate) errors.startDate = "Seleccioná una fecha de inicio";
    if (!endDate) errors.endDate = "Seleccioná una fecha de fin";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errors.endDate = "La fecha de fin debe ser posterior a la de inicio";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (!validate(formData)) return;

    setLoading(true);
    const result = await registerSubscriber(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="parkingId" value={parkingId} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
        <input
          type="text"
          name="licensePlate"
          required
          placeholder="Ej: ABCD12"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
            fieldErrors.licensePlate ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.licensePlate && <p className="mt-1 text-xs text-red-600">{fieldErrors.licensePlate}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del propietario</label>
        <input
          type="text"
          name="ownerName"
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.ownerName ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.ownerName && <p className="mt-1 text-xs text-red-600">{fieldErrors.ownerName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
        <input
          type="text"
          name="ownerPhone"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto mensual (CLP)</label>
        <input
          type="number"
          name="monthlyFeeClp"
          required
          min={1}
          placeholder="Ej: 50000"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.monthlyFeeClp ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.monthlyFeeClp && <p className="mt-1 text-xs text-red-600">{fieldErrors.monthlyFeeClp}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
          <input
            type="date"
            name="startDate"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.startDate ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.startDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.startDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
          <input
            type="date"
            name="endDate"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.endDate ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.endDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {loading ? "Registrando..." : "Registrar abonado"}
      </button>
    </form>
  );
}
