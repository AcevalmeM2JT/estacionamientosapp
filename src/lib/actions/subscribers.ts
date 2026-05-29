"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const subscriberSchema = z.object({
  parkingId: z.string().uuid(),
  licensePlate: z.string().min(6, "La patente debe tener al menos 6 caracteres"),
  ownerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  ownerPhone: z.string().optional(),
  monthlyFeeClp: z.coerce.number().min(1, "El monto mensual debe ser mayor a 0"),
  startDate: z.string(),
  endDate: z.string(),
});

export async function registerSubscriber(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const parsed = subscriberSchema.safeParse({
    parkingId: formData.get("parkingId"),
    licensePlate: formData.get("licensePlate"),
    ownerName: formData.get("ownerName"),
    ownerPhone: formData.get("ownerPhone"),
    monthlyFeeClp: formData.get("monthlyFeeClp"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const parking = await prisma.parkingFacility.findUnique({
      where: { id: parsed.data.parkingId, owner_id: session.user.id },
    });

    if (!parking) return { error: "Estacionamiento no encontrado" };

    await prisma.subscriber.create({
      data: {
        parking_id: parsed.data.parkingId,
        license_plate: parsed.data.licensePlate.toUpperCase(),
        owner_name: parsed.data.ownerName,
        owner_phone: parsed.data.ownerPhone,
        monthly_fee_clp: parsed.data.monthlyFeeClp,
        start_date: new Date(parsed.data.startDate),
        end_date: new Date(parsed.data.endDate),
        is_active: true,
      },
    });

    revalidatePath("/dashboard/subscribers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al registrar el abonado. Verifica que la patente no esté ya registrada." };
  }
}

export async function getSubscribersByParking(parkingId: string) {
  const session = await auth();
  if (!session?.user) return [];

  try {
    return prisma.subscriber.findMany({
      where: {
        parking_id: parkingId,
        parking: { owner_id: session.user.id },
      },
      orderBy: { created_at: "desc" },
    });
  } catch {
    return [];
  }
}

export async function deactivateSubscriber(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    await prisma.subscriber.update({
      where: { id },
      data: { is_active: false },
    });

    revalidatePath("/dashboard/subscribers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al desactivar el abonado" };
  }
}
