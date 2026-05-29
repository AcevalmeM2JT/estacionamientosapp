"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error en el panel</h2>
        <p className="text-gray-500 mb-4">No se pudo cargar esta sección.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
