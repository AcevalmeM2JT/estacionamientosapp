export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}
