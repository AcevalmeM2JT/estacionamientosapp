"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createParking } from "@/lib/actions/parking";
import LocationPicker from "./location-picker";

export function CreateParkingForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(formData: FormData): boolean {
    const errors: Record<string, string> = {};
    const name = formData.get("name") as string;
    const totalSpots = formData.get("total_spots") as string;
    const reservedSpots = formData.get("reserved_spots") as string;
    const address = formData.get("address") as string;

    if (!name || name.trim().length < 2) errors.name = "El nombre debe tener al menos 2 caracteres";
    if (!address || address.trim().length < 5) errors.address = "Ingresá una dirección válida";
    if (!totalSpots || parseInt(totalSpots) < 1) errors.total_spots = "Debe haber al menos 1 lugar";
    if (reservedSpots && parseInt(reservedSpots) < 0) errors.reserved_spots = "No puede ser negativo";
    if (totalSpots && reservedSpots && parseInt(reservedSpots) > parseInt(totalSpots)) {
      errors.reserved_spots = "No puede superar el total de lugares";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (!validate(formData)) return;

    setLoading(true);
    const result = await createParking(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del estacionamiento</label>
        <input
          type="text"
          name="name"
          required
          placeholder="Ej: Estacionamiento Central"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.name ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
        <LocationPicker />
        {fieldErrors.address && <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Describe tu estacionamiento..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total de lugares</label>
          <input
            type="number"
            name="total_spots"
            required
            min={1}
            placeholder="Ej: 50"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.total_spots ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.total_spots && <p className="mt-1 text-xs text-red-600">{fieldErrors.total_spots}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lugares para reserva</label>
          <input
            type="number"
            name="reserved_spots"
            min={0}
            defaultValue={0}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.reserved_spots ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.reserved_spots && <p className="mt-1 text-xs text-red-600">{fieldErrors.reserved_spots}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_public"
          id="is_public"
          defaultChecked
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_public" className="text-sm text-gray-700">
          Aparecer en el marketplace público
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {loading ? "Creando..." : "Crear estacionamiento"}
      </button>
    </form>
  );
}
