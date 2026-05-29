"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function getWorkerSchedule(workerId: string) {
  const session = await auth();
  if (!session?.user) return [];

  try {
    return prisma.workerSchedule.findMany({
      where: { worker_id: workerId },
      orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
    });
  } catch {
    return [];
  }
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function isWorkerOnSchedule(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const worker = await prisma.parkingWorker.findFirst({
      where: { user_id: userId },
    });

    if (!worker) return { allowed: false, reason: "No tienes un estacionamiento asignado" };

    const schedules = await prisma.workerSchedule.findMany({
      where: { worker_id: worker.id },
    });

    if (schedules.length === 0) return { allowed: true };

    const now = new Date();
    const chileOffset = -3 * 60;
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const chileMinutes = (utcMinutes + chileOffset + 24 * 60) % (24 * 60);
    const chileHour = Math.floor(chileMinutes / 60);
    const chileMin = chileMinutes % 60;
    const currentTime = `${String(chileHour).padStart(2, "0")}:${String(chileMin).padStart(2, "0")}`;

    const dayOfWeek = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" })).getDay();
    const todaySchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);

    if (todaySchedules.length === 0) {
      return { allowed: false, reason: "Hoy no tienes horario asignado" };
    }

    const allowed = todaySchedules.some(
      (s) => currentTime >= s.start_time && currentTime <= s.end_time
    );

    if (!allowed) {
      const ranges = todaySchedules
        .map((s) => `${s.start_time} - ${s.end_time}`)
        .join(", ");
      return { allowed: false, reason: `Tu horario hoy es ${ranges}` };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export async function saveWorkerSchedule(
  workerId: string,
  schedules: { day_of_week: number; start_time: string; end_time: string }[]
) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    const worker = await prisma.parkingWorker.findUnique({
      where: { id: workerId },
      include: { parking: { select: { owner_id: true } } },
    });

    if (!worker || worker.parking.owner_id !== session.user.id) {
      return { error: "No autorizado" };
    }

    for (const s of schedules) {
      if (parseTimeToMinutes(s.start_time) >= parseTimeToMinutes(s.end_time)) {
        return { error: "La hora de inicio debe ser anterior a la hora de término" };
      }
    }

    await prisma.workerSchedule.deleteMany({
      where: { worker_id: workerId },
    });

    if (schedules.length > 0) {
      await prisma.workerSchedule.createMany({
        data: schedules.map((s) => ({ worker_id: workerId, ...s })),
      });
    }

    return { success: true };
  } catch {
    return { error: "Error al guardar horario" };
  }
}
