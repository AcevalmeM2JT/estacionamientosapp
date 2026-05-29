"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { logActivity } from "./activity";

const workerSchema = z.object({
  parkingId: z.string().uuid(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
});

export async function assignWorker(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const parsed = workerSchema.safeParse({
    parkingId: formData.get("parkingId"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const parking = await prisma.parkingFacility.findUnique({
      where: { id: parsed.data.parkingId, owner_id: session.user.id },
    });

    if (!parking) return { error: "Estacionamiento no encontrado" };

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const passwordHash = await bcrypt.hash(parsed.data.password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: parsed.data.email,
          password_hash: passwordHash,
          name: parsed.data.name,
          phone: parsed.data.phone,
          role: "WORKER",
          is_active: true,
        },
      });
      userId = newUser.id;
    }

    await prisma.parkingWorker.create({
      data: {
        parking_id: parsed.data.parkingId,
        user_id: userId,
      },
    });

    await logActivity(parsed.data.parkingId, session.user.id, "WORKER_ASSIGNED", {
      worker_name: parsed.data.name,
      worker_email: parsed.data.email,
    });

    revalidatePath("/dashboard/workers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al asignar trabajador. Verifica que el email no esté ya registrado." };
  }
}

export async function getWorkersByParking(parkingId: string) {
  const session = await auth();
  if (!session?.user) return [];

  try {
    return prisma.parkingWorker.findMany({
      where: { parking_id: parkingId },
      include: { user: true },
      orderBy: { assigned_at: "desc" },
    });
  } catch {
    return [];
  }
}

export async function removeWorker(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    const worker = await prisma.parkingWorker.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    if (!worker) return { error: "Trabajador no encontrado" };

    await prisma.parkingWorker.delete({
      where: { id },
    });

    await logActivity(worker.parking_id, session.user.id, "WORKER_REMOVED", {
      worker_name: worker.user.name,
    });

    revalidatePath("/dashboard/workers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al remover trabajador" };
  }
}
