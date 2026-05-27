"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const pricingSchema = z.object({
  price_per_minute: z.coerce.number().min(0).optional(),
  price_per_hour: z.coerce.number().min(0).optional(),
  price_per_day: z.coerce.number().min(0).optional(),
  price_per_month: z.coerce.number().min(0).optional(),
  billing_mode: z.enum(["MINUTE", "HOUR", "DAY", "MONTH"]),
});

export async function updatePricing(parkingId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const parking = await prisma.parkingFacility.findUnique({
    where: { id: parkingId, owner_id: session.user.id },
  });

  if (!parking) return { error: "Estacionamiento no encontrado" };

  const parsed = pricingSchema.safeParse({
    price_per_minute: formData.get("price_per_minute") || undefined,
    price_per_hour: formData.get("price_per_hour") || undefined,
    price_per_day: formData.get("price_per_day") || undefined,
    price_per_month: formData.get("price_per_month") || undefined,
    billing_mode: formData.get("billing_mode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.pricingConfig.upsert({
      where: { parking_id: parkingId },
      create: {
        parking_id: parkingId,
        ...parsed.data,
      },
      update: parsed.data,
    });

    revalidatePath("/dashboard/parking");
    return { success: true };
  } catch {
    return { error: "Error al actualizar precios" };
  }
}
