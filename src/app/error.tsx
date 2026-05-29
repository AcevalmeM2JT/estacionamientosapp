"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Algo salió mal</h1>
        <p className="text-gray-600 mb-6">Ocurrió un error inesperado. Intentá de nuevo.</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
