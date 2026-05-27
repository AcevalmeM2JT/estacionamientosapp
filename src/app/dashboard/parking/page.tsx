import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParkingsByOwner, createParking, updateParking, toggleParkingPublic, deleteParking } from "@/lib/actions/parking";
import { updatePricing } from "@/lib/actions/pricing";
import LocationPicker from "./location-picker";

export default async function ParkingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "WORKER") redirect("/dashboard");

  const parkings = await getParkingsByOwner();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi Estacionamiento</h1>
        <p className="text-gray-600 mt-1">Configura tu estacionamiento y precios</p>
      </div>

      {parkings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Crear nuevo estacionamiento</h2>
          <form action={async (formData) => {
            "use server";
            await createParking(formData);
          }} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del estacionamiento
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Estacionamiento Central"
              />
            </div>

            <LocationPicker />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe tu estacionamiento..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total de lugares
                </label>
                <input
                  type="number"
                  name="total_spots"
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugares para reserva
                </label>
                <input
                  type="number"
                  name="reserved_spots"
                  min={0}
                  defaultValue={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 5"
                />
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
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Crear estacionamiento
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {parkings.map((parking) => (
            <div key={parking.id} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{parking.name}</h2>
                    <p className="text-sm text-gray-600">{parking.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        parking.is_public
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {parking.is_public ? "Público" : "Privado"}
                    </span>
                    <form action={async () => {
                      "use server";
                      await toggleParkingPublic(parking.id);
                    }}>
                      <button
                        type="submit"
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          parking.is_public
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {parking.is_public ? "Ocultar" : "Publicar"}
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await deleteParking(parking.id);
                    }}>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Editar información</h3>
                  <form action={async (formData) => {
                    "use server";
                    await updateParking(parking.id, formData);
                  }} className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={parking.name}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <LocationPicker defaultLat={parking.latitude} defaultLng={parking.longitude} defaultAddress={parking.address} />

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={parking.description || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Total de lugares</label>
                        <input
                          type="number"
                          name="total_spots"
                          defaultValue={parking.total_spots}
                          required
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Lugares reservados</label>
                        <input
                          type="number"
                          name="reserved_spots"
                          defaultValue={parking.reserved_spots}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_public"
                        id={`is_public_${parking.id}`}
                        defaultChecked={parking.is_public}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`is_public_${parking.id}`} className="text-sm text-gray-700">
                        Público en marketplace
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Guardar cambios
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Configuración de precios</h3>
                  <form action={async (formData) => {
                    "use server";
                    await updatePricing(parking.id, formData);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Por minuto ($)</label>
                        <input
                          type="number"
                          name="price_per_minute"
                          defaultValue={parking.pricing_config?.price_per_minute || ""}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Por hora ($)</label>
                        <input
                          type="number"
                          name="price_per_hour"
                          defaultValue={parking.pricing_config?.price_per_hour || ""}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Por día ($)</label>
                        <input
                          type="number"
                          name="price_per_day"
                          defaultValue={parking.pricing_config?.price_per_day || ""}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Por mes ($)</label>
                        <input
                          type="number"
                          name="price_per_month"
                          defaultValue={parking.pricing_config?.price_per_month || ""}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Modo de facturación</label>
                      <select
                        name="billing_mode"
                        defaultValue={parking.pricing_config?.billing_mode || "HOUR"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MINUTE">Por minuto</option>
                        <option value="HOUR">Por hora</option>
                        <option value="DAY">Por día</option>
                        <option value="MONTH">Por mes</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Guardar precios
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Resumen</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total de lugares</span>
                        <span className="font-medium">{parking.total_spots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lugares reservados</span>
                        <span className="font-medium">{parking.reserved_spots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disponibles</span>
                        <span className="font-medium text-green-600">{parking.total_spots - parking.reserved_spots}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
