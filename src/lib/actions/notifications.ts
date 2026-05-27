"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "./activity";

export async function getNotifications(parkingId: string) {
  const session = await auth();
  if (!session?.user) return [];

  try {
    return prisma.notification.findMany({
      where: { parking_id: parkingId },
      orderBy: { created_at: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}

export async function getUnreadCount(parkingId: string) {
  const session = await auth();
  if (!session?.user) return 0;

  try {
    return prisma.notification.count({
      where: { parking_id: parkingId, is_read: false },
    });
  } catch {
    return 0;
  }
}

export async function markNotificationsRead(parkingId: string) {
  const session = await auth();
  if (!session?.user) return;

  try {
    await prisma.notification.updateMany({
      where: { parking_id: parkingId, is_read: false },
      data: { is_read: true },
    });
  } catch {
    // silent
  }
}

export async function checkAndNotifyFull(parkingId: string, userId: string) {
  try {
    const parking = await prisma.parkingFacility.findUnique({
      where: { id: parkingId },
    });

    if (!parking) return;

    const parkedCount = await prisma.vehicle.count({
      where: { parking_id: parkingId, status: "PARKED" },
    });

    const available = parking.total_spots - parkedCount;

    if (available === 0) {
      const recentFull = await prisma.notification.findFirst({
        where: {
          parking_id: parkingId,
          type: "PARKING_FULL",
          created_at: { gte: new Date(Date.now() - 3600000) },
        },
      });

      if (!recentFull) {
        await prisma.notification.create({
          data: {
            parking_id: parkingId,
            type: "PARKING_FULL",
            message: `El estacionamiento "${parking.name}" está completo (${parking.total_spots}/${parking.total_spots} ocupados)`,
          },
        });

        await logActivity(parkingId, userId, "NOTIFICATION_FULL", {
          message: "Estacionamiento completo",
        });
      }
    }
  } catch {
    // silent
  }
}
