"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const parkingSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  description: z.string().optional(),
  total_spots: z.coerce.number().min(1, "Debe tener al menos 1 lugar"),
  reserved_spots: z.coerce.number().min(0, "No puede ser negativo"),
  is_public: z.boolean(),
  opens_at: z.string().optional(),
  closes_at: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export async function createParking(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const parsed = parkingSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    description: formData.get("description"),
    total_spots: formData.get("total_spots"),
    reserved_spots: formData.get("reserved_spots") || 0,
    is_public: formData.get("is_public") === "on",
    opens_at: formData.get("opens_at") || undefined,
    closes_at: formData.get("closes_at") || undefined,
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const { latitude, longitude, ...rest } = parsed.data;
    await prisma.parkingFacility.create({
      data: {
        ...rest,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        owner_id: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/parking");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error al crear el estacionamiento" };
  }
}

export async function updateParking(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const parsed = parkingSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    description: formData.get("description"),
    total_spots: formData.get("total_spots"),
    reserved_spots: formData.get("reserved_spots") || 0,
    is_public: formData.get("is_public") === "on",
    opens_at: formData.get("opens_at") || undefined,
    closes_at: formData.get("closes_at") || undefined,
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const { latitude, longitude, ...rest } = parsed.data;
    await prisma.parkingFacility.update({
      where: { id, owner_id: session.user.id },
      data: {
        ...rest,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });

    revalidatePath("/dashboard/parking");
    revalidatePath("/");
    revalidatePath(`/parking/${id}`);
    return { success: true };
  } catch {
    return { error: "Error al actualizar el estacionamiento" };
  }
}

export async function toggleParkingPublic(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    const parking = await prisma.parkingFacility.findUnique({
      where: { id, owner_id: session.user.id },
    });

    if (!parking) return { error: "Estacionamiento no encontrado" };

    await prisma.parkingFacility.update({
      where: { id },
      data: { is_public: !parking.is_public },
    });

    revalidatePath("/dashboard/parking");
    revalidatePath("/");
    revalidatePath(`/parking/${id}`);
    return { success: true };
  } catch {
    return { error: "Error al cambiar visibilidad" };
  }
}

export async function deleteParking(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    await prisma.parkingFacility.delete({
      where: { id, owner_id: session.user.id },
    });

    revalidatePath("/dashboard/parking");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el estacionamiento" };
  }
}

export async function getParkingsByOwner() {
  const session = await auth();
  if (!session?.user) return [];

  const parkingIds = await getParkingIdsForUser(session.user.id, session.user.role);

  if (parkingIds.length === 0) return [];

  return prisma.parkingFacility.findMany({
    where: { id: { in: parkingIds } },
    include: { pricing_config: true },
    orderBy: { created_at: "desc" },
  });
}

export async function getParkingIdsForUser(userId: string, role?: string | null): Promise<string[]> {
  if (role === "WORKER") {
    const workers = await prisma.parkingWorker.findMany({
      where: { user_id: userId },
      select: { parking_id: true },
    });
    return workers.map((w) => w.parking_id);
  }

  if (!role) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "WORKER") {
      const workers = await prisma.parkingWorker.findMany({
        where: { user_id: userId },
        select: { parking_id: true },
      });
      return workers.map((w) => w.parking_id);
    }
  }

  const parkings = await prisma.parkingFacility.findMany({
    where: { owner_id: userId },
    select: { id: true },
  });
  return parkings.map((p) => p.id);
}

export async function getParkingById(id: string) {
  const session = await auth();
  if (!session?.user) return null;

  const parkingIds = await getParkingIdsForUser(session.user.id, session.user.role);
  if (!parkingIds.includes(id)) return null;

  return prisma.parkingFacility.findUnique({
    where: { id },
    include: { pricing_config: true },
  });
}

export async function getAvailableSpots(parkingId: string) {
  const session = await auth();
  if (!session?.user) return 0;

  const parkingIds = await getParkingIdsForUser(session.user.id, session.user.role);
  if (!parkingIds.includes(parkingId)) return 0;

  const parking = await prisma.parkingFacility.findUnique({
    where: { id: parkingId },
  });

  if (!parking) return 0;

  const parkedCount = await prisma.vehicle.count({
    where: {
      parking_id: parkingId,
      status: "PARKED",
    },
  });

  return parking.total_spots - parkedCount;
}
