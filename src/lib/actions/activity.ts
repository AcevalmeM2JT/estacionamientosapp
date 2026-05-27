"use server";

import { prisma } from "@/lib/db";

export async function logActivity(
  parkingId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        parking_id: parkingId,
        user_id: userId,
        action,
        details: details as any,
      },
    });
  } catch {
    // silent fail - logging should never break the main flow
  }
}

export async function getRecentActivity(parkingId: string, limit = 30) {
  try {
    return prisma.activityLog.findMany({
      where: { parking_id: parkingId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}
