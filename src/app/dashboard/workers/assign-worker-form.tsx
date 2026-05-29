"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignWorker } from "@/lib/actions/workers";

interface Props {
  parkingId: string;
}

export function AssignWorkerForm({ parkingId }: Props) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(formData: FormData): boolean {
    const errors: Record<string, string> = {};
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || name.trim().length < 2) errors.name = "El nombre debe tener al menos 2 caracteres";
    if (!email || !email.includes("@")) errors.email = "Ingresá un email válido";
    if (!password || password.length < 6) errors.password = "La contraseña debe tener al menos 6 caracteres";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (!validate(formData)) return;

    setLoading(true);
    const result = await assignWorker(formData);
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
        <input
          type="text"
          name="name"
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.name ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.email ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.password ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
        <input
          type="text"
          name="phone"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {loading ? "Asignando..." : "Asignar trabajador"}
      </button>
    </form>
  );
}
