import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Estacionamiento no encontrado</p>
        <p className="mt-2 text-gray-500">
          El estacionamiento que buscas no existe o no está disponible públicamente.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Volver al marketplace
        </Link>
      </div>
    </div>
  );
}
