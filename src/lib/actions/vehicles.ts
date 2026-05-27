"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import { checkAndNotifyFull } from "./notifications";

const entrySchema = z.object({
  parkingId: z.string().uuid(),
  licensePlate: z.string().min(6, "La patente debe tener al menos 6 caracteres"),
});

export async function registerEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const parkingId = formData.get("parkingId") as string;
  const licensePlate = formData.get("licensePlate") as string;

  const parsed = entrySchema.safeParse({ parkingId, licensePlate });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const parking = await prisma.parkingFacility.findUnique({
      where: { id: parkingId },
      include: { pricing_config: true },
    });

    if (!parking) return { error: "Estacionamiento no encontrado" };

    const activeVehicle = await prisma.vehicle.findFirst({
      where: {
        parking_id: parkingId,
        license_plate: licensePlate.toUpperCase(),
        status: "PARKED",
      },
    });

    if (activeVehicle) {
      return { error: "Ya existe un vehículo con esa patente estacionado" };
    }

    const parkedCount = await prisma.vehicle.count({
      where: {
        parking_id: parkingId,
        status: "PARKED",
      },
    });

    if (parkedCount >= parking.total_spots) {
      return { error: "No hay lugares disponibles" };
    }

    const isSubscriber = await prisma.subscriber.findFirst({
      where: {
        parking_id: parkingId,
        license_plate: licensePlate.toUpperCase(),
        is_active: true,
      },
    });

    await prisma.vehicle.create({
      data: {
        parking_id: parkingId,
        license_plate: licensePlate.toUpperCase(),
        registered_by: session.user.id,
        is_subscriber: !!isSubscriber,
        status: "PARKED",
      },
    });

    await logActivity(parkingId, session.user.id, "VEHICLE_ENTRY", {
      license_plate: licensePlate.toUpperCase(),
      is_subscriber: !!isSubscriber,
    });

    await checkAndNotifyFull(parkingId, session.user.id);

    revalidatePath("/dashboard/operations");
    return { success: true, isSubscriber: !!isSubscriber };
  } catch {
    return { error: "Error al registrar la entrada" };
  }
}

export async function searchVehicle(parkingId: string, licensePlate: string) {
  const session = await auth();
  if (!session?.user) return null;

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        parking_id: parkingId,
        license_plate: licensePlate.toUpperCase(),
        status: "PARKED",
      },
      include: {
        parking: { include: { pricing_config: true } },
      },
    });

    return vehicle;
  } catch {
    return null;
  }
}

export async function calculateCost(vehicleId: string) {
  const session = await auth();
  if (!session?.user) return null;

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        parking: { include: { pricing_config: true } },
      },
    });

    if (!vehicle || !vehicle.parking.pricing_config) return null;

    if (vehicle.is_subscriber) {
      return { cost: 0, durationMinutes: 0, isSubscriber: true };
    }

    const entryTime = new Date(vehicle.entry_time);
    const now = new Date();
    const durationMs = now.getTime() - entryTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const pricing = vehicle.parking.pricing_config;

    let cost = 0;
    switch (pricing.billing_mode) {
      case "MINUTE":
        cost = durationMinutes * (pricing.price_per_minute || 0);
        break;
      case "HOUR":
        cost = Math.ceil(durationMinutes / 60) * (pricing.price_per_hour || 0);
        break;
      case "DAY":
        cost = Math.ceil(durationMinutes / (60 * 24)) * (pricing.price_per_day || 0);
        break;
      case "MONTH":
        cost = Math.ceil(durationMinutes / (60 * 24 * 30)) * (pricing.price_per_month || 0);
        break;
    }

    return {
      cost,
      durationMinutes,
      isSubscriber: false,
      entryTime,
      billingMode: pricing.billing_mode,
    };
  } catch {
    return null;
  }
}

export async function processExit(vehicleId: string, paymentMethod: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        parking: { include: { pricing_config: true } },
      },
    });

    if (!vehicle || vehicle.status !== "PARKED") {
      return { error: "Vehículo no encontrado" };
    }

    const costResult = await calculateCost(vehicleId);
    if (!costResult) return { error: "Error al calcular el costo" };

    const exitTime = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          exit_time: exitTime,
          status: "COMPLETED",
        },
      });

      if (!vehicle.is_subscriber && costResult.cost > 0) {
        const receiptNumber = `REC-${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
        
        await tx.transaction.create({
          data: {
            vehicle_id: vehicleId,
            amount_clp: costResult.cost,
            duration_minutes: costResult.durationMinutes,
            payment_method: paymentMethod.toUpperCase() as "CASH" | "TRANSFER" | "CARD",
            receipt_number: receiptNumber,
            created_by: session.user.id,
          },
        });
      }
    });

    await logActivity(vehicle.parking_id, session.user.id, "VEHICLE_EXIT", {
      license_plate: vehicle.license_plate,
      cost: costResult.cost,
      payment_method: paymentMethod,
      is_subscriber: vehicle.is_subscriber,
    });

    revalidatePath("/dashboard/operations");
    return { success: true, cost: costResult.cost };
  } catch {
    return { error: "Error al procesar la salida" };
  }
}

export async function processExitFromForm(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const vehicleId = formData.get("vehicleId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  if (!vehicleId || !paymentMethod) {
    return { error: "Datos incompletos" };
  }

  return processExit(vehicleId, paymentMethod);
}

export async function getActiveVehicles(parkingId: string) {
  const session = await auth();
  if (!session?.user) return [];

  try {
    return prisma.vehicle.findMany({
      where: {
        parking_id: parkingId,
        status: "PARKED",
      },
      orderBy: { entry_time: "desc" },
    });
  } catch {
    return [];
  }
}
